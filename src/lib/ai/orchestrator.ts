import { prisma } from "@/lib/db/prisma";
import { supabase } from "@/lib/db/supabase";
import { WhatsAppClient } from "@/lib/whatsapp/client";
import {
  analyzeWithJev,
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  JevAnalysisResult
} from "./jev-client";
import { generateEmbedding } from "./embeddings";
import { generateSirdasReply } from "./gemini-client";
import { handleOnboardingMessage } from "@/lib/whatsapp/onboarding";
import { SirdasOutput } from "./schemas";

export interface IncomingMessagePayload {
  phoneNumber: string;
  text: string;
  messageId: string;
}

export interface OrchestrationResult {
  status: "idempotent_skipped" | "onboarding" | "fatwa_blocked" | "crisis_redirected" | "processed";
  replyText?: string;
  audioSent?: boolean;
  audioUrlSent?: string | null;
  editorAudit?: any;
  jevResult?: JevAnalysisResult;
}

export async function processIncomingMessage(
  payload: IncomingMessagePayload
): Promise<OrchestrationResult> {
  const { phoneNumber, text, messageId } = payload;
  const wa = new WhatsAppClient();

  // 0. Mükerrer Mesaj (Retry Storm Idempotency) Kontrolü
  const existingMessage = await prisma.message.findUnique({
    where: { waMessageId: messageId }
  });
  if (existingMessage) {
    console.log(`[Idempotency] ${messageId} daha önce işlenmiş, atlanıyor.`);
    return { status: "idempotent_skipped" };
  }

  // Okundu bilgisi gönder (Mavi Tik)
  await wa.markAsRead(messageId).catch(() => {});

  // 1. Kullanıcı ve Onboarding Kontrolü ("4 Bloklu Dijital İkiz")
  let user = await prisma.user.findUnique({
    where: { phoneNumber }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phoneNumber,
        onboardingStep: 1,
        onboardingCompleted: false,
        profileMetadata: {}
      }
    });
  }

  if (!user.onboardingCompleted) {
    await handleOnboardingMessage(user, text, messageId, wa);
    return { status: "onboarding" };
  }

  // 2. System 1 (Jev) Refleks ve Sınıflandırma Analizi
  const jevResult = await analyzeWithJev({
    userMessage: text,
    userContextSnippet: JSON.stringify(user.profileMetadata)
  });

  // Guardrail 1: Açık Fıkıh ve Fetva Talebi Engeli (Gemini hiç çağrılmaz)
  if (jevResult.is_fiqh_fatwa_request >= 0.75) {
    await wa.sendTextMessage(phoneNumber, FATWA_REJECTION_MESSAGE);

    await prisma.$transaction([
      prisma.message.create({
        data: {
          waMessageId: messageId,
          userId: user.id,
          role: "USER",
          content: text,
          jevMetadata: jevResult as any
        }
      }),
      prisma.message.create({
        data: {
          userId: user.id,
          role: "ASSISTANT",
          content: FATWA_REJECTION_MESSAGE,
          jevMetadata: { bypassed_to_fatwa_block: true }
        }
      })
    ]);

    return {
      status: "fatwa_blocked",
      replyText: FATWA_REJECTION_MESSAGE,
      jevResult
    };
  }

  // Guardrail 2: Ağır Varoluşsal Kriz & İntihar Emniyet Hattı
  if (jevResult.distress_level >= 10) {
    const lower = text.toLowerCase();
    if (
      lower.includes("intihar") ||
      lower.includes("ölmek istiyorum") ||
      lower.includes("canıma kıyacağım") ||
      lower.includes("yaşamak istemiyorum")
    ) {
      await wa.sendTextMessage(phoneNumber, CRISIS_EMERGENCY_MESSAGE);

      await prisma.$transaction([
        prisma.message.create({
          data: {
            waMessageId: messageId,
            userId: user.id,
            role: "USER",
            content: text,
            jevMetadata: jevResult as any
          }
        }),
        prisma.message.create({
          data: {
            userId: user.id,
            role: "ASSISTANT",
            content: CRISIS_EMERGENCY_MESSAGE,
            jevMetadata: { crisis_redirect: true }
          }
        })
      ]);

      return {
        status: "crisis_redirected",
        replyText: CRISIS_EMERGENCY_MESSAGE,
        jevResult
      };
    }
  }

  // Guardrail 3: Üslup Yönetimi ve Kriz Yumuşatması
  const userMetadata = (user.profileMetadata as any) || {};
  let effectiveTone: "SEFKATLI_TESKIN" | "TAVIZSIZ_MUALLIM" =
    userMetadata?.tone_preference === "TAVIZSIZ_MUALLIM" ? "TAVIZSIZ_MUALLIM" : "SEFKATLI_TESKIN";

  if (jevResult.distress_level >= 8) {
    // Kriz anında tavizsiz üslup seçilmiş olsa bile otomatik şefkat ve Talâk 2-3 moduna yumuşat
    effectiveTone = "SEFKATLI_TESKIN";
  }

  // 3. Çelik Kasa (Supabase pgvector Hybrid RAG) Araması
  const isRibaShieldActive = jevResult.is_debt_or_riba_related >= 0.60;
  const queryEmbedding = await generateEmbedding(text);

  let chunks: Array<{
    id: string;
    sourceType: string;
    sourceTitle: string;
    content: string;
    audioUrl?: string | null;
  }> = [];

  try {
    const { data: ragResults, error: rpcError } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 4,
      filter_category: jevResult.rag_category,
      filter_nafs: jevResult.nafs_trap,
      force_riba: isRibaShieldActive
    });

    if (rpcError) {
      console.warn("[Supabase RPC RAG Warning - Falling back to Prisma search]", rpcError);
    } else if (Array.isArray(ragResults) && ragResults.length > 0) {
      chunks = ragResults.map((r: any) => ({
        id: r.id,
        sourceType: r.source_type,
        sourceTitle: r.source_title,
        content: r.content,
        audioUrl: r.audio_url
      }));
    }
  } catch (err) {
    console.warn("[RAG Lookup Error]", err);
  }

  // Eğer RPC sonucu boşsa (veya lokal test ortamındaysak), Prisma'dan yedek kaynakları çek
  if (chunks.length === 0) {
    const dbChunks = await prisma.knowledgeChunk.findMany({
      where: isRibaShieldActive ? { isRibaRelated: true } : undefined,
      take: 4,
      orderBy: { createdAt: "desc" }
    });

    chunks = dbChunks.map(c => ({
      id: c.id,
      sourceType: c.sourceType,
      sourceTitle: c.sourceTitle,
      content: c.content,
      audioUrl: c.audioUrl
    }));
  }

  // 4. Gemini 2.5 Flash (System 2) - İçsel Editör + Yazar Motoru
  const sirdasReply: SirdasOutput = await generateSirdasReply({
    userMessage: text,
    userProfile: user.profileMetadata,
    effectiveTone,
    distressLevel: jevResult.distress_level,
    isRibaShieldActive,
    nafsTrap: jevResult.nafs_trap,
    ragCategory: jevResult.rag_category,
    ragChunks: chunks
  });

  // 5. WhatsApp Mesaj Dağıtımı (Metin + Varsa .ogg Ses Dosyası)
  await wa.sendTextMessage(phoneNumber, sirdasReply.whatsapp_reply);

  let audioSent = false;
  let audioUrlSent: string | null = null;

  if (jevResult.needs_audio_snippet >= 0.7 && sirdasReply.selected_audio_chunk_id) {
    const matchedChunk = chunks.find(c => c.id === sirdasReply.selected_audio_chunk_id);
    if (matchedChunk && matchedChunk.audioUrl) {
      try {
        await wa.sendAudioMessage(phoneNumber, matchedChunk.audioUrl);
        audioSent = true;
        audioUrlSent = matchedChunk.audioUrl;
      } catch (audioErr) {
        console.error("[WhatsApp Audio Delivery Failed - Continuing with text only]", audioErr);
      }
    }
  }

  // 6. Veritabanı ve VAS Loglarının Atomik Güncellenmesi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Profil Güncellemeleri Varsa Birleştir
  const updatedProfile = { ...userMetadata };
  if (sirdasReply.profile_updates) {
    if (sirdasReply.profile_updates.new_roles?.length) {
      updatedProfile.roles = Array.from(
        new Set([...(updatedProfile.roles || []), ...sirdasReply.profile_updates.new_roles])
      );
    }
    if (sirdasReply.profile_updates.new_weaknesses?.length) {
      updatedProfile.spiritual_trials = Array.from(
        new Set([
          ...(updatedProfile.spiritual_trials || []),
          ...sirdasReply.profile_updates.new_weaknesses
        ])
      );
    }
  }

  await prisma.$transaction([
    // Kullanıcı mesajı
    prisma.message.create({
      data: {
        waMessageId: messageId,
        userId: user.id,
        role: "USER",
        content: text,
        jevMetadata: jevResult as any
      }
    }),
    // Sırdaş AI cevabı
    prisma.message.create({
      data: {
        userId: user.id,
        role: "ASSISTANT",
        content: sirdasReply.whatsapp_reply,
        ragChunkIds: chunks.map(c => c.id),
        editorAudit: sirdasReply.editor_audit as any,
        audioSent,
        audioUrlSent
      }
    }),
    // Profil güncellemesi
    prisma.user.update({
      where: { id: user.id },
      data: {
        profileMetadata: updatedProfile,
        lastActiveAt: new Date()
      }
    }),
    // Operatör VAS günlük log artırımı
    prisma.vasDailyLog.upsert({
      where: {
        userId_logDate: {
          userId: user.id,
          logDate: today
        }
      },
      create: {
        userId: user.id,
        logDate: today,
        incomingCount: 1,
        outgoingCount: audioSent ? 2 : 1,
        estimatedMinutes: 2.5 // Mesaj okuma ve ses dinleme eşdeğer süresi
      },
      update: {
        incomingCount: { increment: 1 },
        outgoingCount: { increment: audioSent ? 2 : 1 },
        estimatedMinutes: { increment: 2.5 }
      }
    })
  ]);

  return {
    status: "processed",
    replyText: sirdasReply.whatsapp_reply,
    audioSent,
    audioUrlSent,
    editorAudit: sirdasReply.editor_audit,
    jevResult
  };
}
