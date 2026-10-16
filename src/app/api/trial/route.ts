import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { supabase } from "@/lib/db/supabase";
import {
  analyzeWithJev,
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  JevAnalysisResult
} from "@/lib/ai/jev-client";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { generateSirdasReply } from "@/lib/ai/gemini-client";

const COOKIE_NAME = "sirdas_trial_v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 yıl

// Sunucu içi bellek önbelleği (DB'ye ek olarak hızlı koruma katmanı)
const inMemoryUsedFingerprints = new Set<string>();

function getSecret(): string {
  return (
    process.env.META_APP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sirdas_ai_trial_hmac_secret_2026"
  );
}

/**
 * Kullanıcının IP + User-Agent bilgisinden anonim, gizlilik dostu SHA-256 parmak izi üretir
 */
function computeVisitorFingerprint(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";
  const ua = req.headers.get("user-agent") || "unknown-ua";

  return crypto
    .createHmac("sha256", getSecret())
    .update(`${ip}::${ua}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Cookie değerini HMAC ile imzalar (kullanıcının cookie'yi elle değiştirmesini engeller)
 */
function signTrialToken(fingerprint: string): string {
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`used::${fingerprint}`)
    .digest("hex")
    .slice(0, 24);
  return `${fingerprint}.${sig}`;
}

function verifyTrialToken(cookieValue: string | undefined): boolean {
  if (!cookieValue || !cookieValue.includes(".")) return false;
  const [fp, sig] = cookieValue.split(".");
  if (!fp || !sig) return false;
  const expected = signTrialToken(fp);
  return cookieValue === expected;
}

/**
 * GET /api/trial
 * Ziyaretçinin tek seferlik deneme hakkını kullanıp kullanmadığını kontrol eder.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
    const fp = computeVisitorFingerprint(req);
    const trialPhoneKey = `web_trial_${fp}`;

    // 1. Cookie kontrolü
    const cookieUsed = verifyTrialToken(cookieVal);

    // 2. Bellek kontrolü
    const memoryUsed = inMemoryUsedFingerprints.has(fp);

    // 3. Veritabanı kontrolü (varsa önceki cevabı da döndür)
    const existingTrialUser = await prisma.user.findUnique({
      where: { phoneNumber: trialPhoneKey },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 2
        }
      }
    });

    if (cookieUsed || memoryUsed || existingTrialUser) {
      const userMsg = existingTrialUser?.messages.find(m => m.role === "USER");
      const assistantMsg = existingTrialUser?.messages.find(m => m.role === "ASSISTANT");

      return NextResponse.json({
        used: true,
        remaining: 0,
        previousTrial:
          userMsg && assistantMsg
            ? {
                userMessage: userMsg.content,
                replyText: assistantMsg.content,
                jevResult: userMsg.jevMetadata,
                editorAudit: assistantMsg.editorAudit,
                audioUrl: assistantMsg.audioUrlSent
              }
            : null
      });
    }

    return NextResponse.json({
      used: false,
      remaining: 1,
      previousTrial: null
    });
  } catch (error) {
    console.error("[GET /api/trial Error]", error);
    return NextResponse.json({ used: false, remaining: 1, previousTrial: null });
  }
}

/**
 * POST /api/trial
 * Ziyaretçinin tek seferlik mesajını alır, System 1 (Jev) + RAG + System 2 (Gemini) hattından geçirir
 * ve hakkını kalıcı olarak kilitler.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    if (!rawMessage || rawMessage.length < 5) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Lütfen gönlünüzü meşgul eden durumu en az birkaç kelimeyle ifade edin."
        },
        { status: 400 }
      );
    }

    if (rawMessage.length > 600) {
      return NextResponse.json(
        {
          error: "MESSAGE_TOO_LONG",
          message: "Deneme mesajınız en fazla 600 karakter olabilir."
        },
        { status: 400 }
      );
    }

    const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
    const fp = computeVisitorFingerprint(req);
    const trialPhoneKey = `web_trial_${fp}`;

    // Çok katmanlı limit kontrolü (Cookie + In-Memory + PostgreSQL)
    const cookieUsed = verifyTrialToken(cookieVal);
    const memoryUsed = inMemoryUsedFingerprints.has(fp);
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: trialPhoneKey }
    });

    if (cookieUsed || memoryUsed || existingUser) {
      return NextResponse.json(
        {
          error: "TRIAL_LIMIT_REACHED",
          message:
            "Web üzerindeki tek seferlik tefekkür hakkınızı kullandınız. Sırdaş AI ile WhatsApp üzerinden tamamen ücretsiz ve sınırsız dertleşmeye devam edebilirsiniz."
        },
        { status: 429 }
      );
    }

    // 1. System 1 (Jev) Refleks ve Sınıflandırma Analizi
    const jevResult: JevAnalysisResult = await analyzeWithJev({
      userMessage: rawMessage,
      userContextSnippet: JSON.stringify({ source: "web_landing_trial" })
    });

    let replyText = "";
    let editorAudit: any = null;
    let audioUrlSent: string | null = null;
    let statusType: "processed" | "fatwa_blocked" | "crisis_redirected" = "processed";

    // Guardrail 1: Fıkıh ve Fetva Engeli
    if (jevResult.is_fiqh_fatwa_request >= 0.75) {
      replyText = FATWA_REJECTION_MESSAGE;
      statusType = "fatwa_blocked";
      editorAudit = {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: "FIKIH_FETVA_SINIRI",
        siyer_example_used: "Ehl-i Zikir ve Alo 190 Yönlendirmesi",
        riba_warning_included: false
      };
    } else if (
      jevResult.distress_level >= 10 &&
      ["intihar", "ölmek istiyorum", "canıma kıyacağım", "yaşamak istemiyorum"].some(k =>
        rawMessage.toLowerCase().includes(k)
      )
    ) {
      // Guardrail 2: Ağır Kriz Emniyet Hattı
      replyText = CRISIS_EMERGENCY_MESSAGE;
      statusType = "crisis_redirected";
      editorAudit = {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: "ACIL_KRIZ_KORUMASI",
        siyer_example_used: "Can Emaneti ve 112 Acil Yardım",
        riba_warning_included: false
      };
    } else {
      // 2. Çelik Kasa RAG Araması
      const isRibaShieldActive = jevResult.is_debt_or_riba_related >= 0.6;
      const queryEmbedding = await generateEmbedding(rawMessage);

      let chunks: Array<{
        id: string;
        sourceType: string;
        sourceTitle: string;
        content: string;
        audioUrl?: string | null;
      }> = [];

      try {
        const { data: ragResults, error: rpcError } = await supabase.rpc(
          "match_knowledge_chunks",
          {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 4,
            filter_category: jevResult.rag_category,
            filter_nafs: jevResult.nafs_trap,
            force_riba: isRibaShieldActive
          }
        );

        if (!rpcError && Array.isArray(ragResults) && ragResults.length > 0) {
          chunks = ragResults.map((r: any) => ({
            id: r.id,
            sourceType: r.source_type,
            sourceTitle: r.source_title,
            content: r.content,
            audioUrl: r.audio_url
          }));
        }
      } catch {
        // Fallback to Prisma below
      }

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

      // 3. System 2 (Gemini 2.5 Flash) Cevap Üretimi
      const sirdasReply = await generateSirdasReply({
        userMessage: rawMessage,
        userProfile: {
          roles: ["MISAFIR_KULLANICI"],
          spiritual_trials: [jevResult.nafs_trap],
          tone_preference: "SEFKATLI_TESKIN"
        },
        effectiveTone: "SEFKATLI_TESKIN",
        distressLevel: jevResult.distress_level,
        isRibaShieldActive,
        nafsTrap: jevResult.nafs_trap,
        ragCategory: jevResult.rag_category,
        ragChunks: chunks
      });

      replyText = sirdasReply.whatsapp_reply;
      editorAudit = sirdasReply.editor_audit;

      if (sirdasReply.selected_audio_chunk_id) {
        const matched = chunks.find(c => c.id === sirdasReply.selected_audio_chunk_id);
        if (matched?.audioUrl) {
          audioUrlSent = matched.audioUrl;
        }
      }
    }

    // 4. Parmak izini belleğe ve veritabanına kaydet
    inMemoryUsedFingerprints.add(fp);

    try {
      const createdUser = await prisma.user.create({
        data: {
          phoneNumber: trialPhoneKey,
          onboardingStep: 4,
          onboardingCompleted: true,
          profileMetadata: {
            source: "web_trial",
            fingerprint: fp,
            usedAt: new Date().toISOString()
          }
        }
      });

      await prisma.$transaction([
        prisma.message.create({
          data: {
            waMessageId: `web_trial_msg_${fp}`,
            userId: createdUser.id,
            role: "USER",
            content: rawMessage,
            jevMetadata: jevResult as any
          }
        }),
        prisma.message.create({
          data: {
            userId: createdUser.id,
            role: "ASSISTANT",
            content: replyText,
            editorAudit: editorAudit as any,
            audioSent: Boolean(audioUrlSent),
            audioUrlSent
          }
        })
      ]);
    } catch (dbErr) {
      console.warn("[POST /api/trial DB Persistence Warning]", dbErr);
    }

    // 5. İmzalı HttpOnly Cookie ile yanıt dön
    const signedToken = signTrialToken(fp);
    const response = NextResponse.json({
      success: true,
      status: statusType,
      used: true,
      remaining: 0,
      trial: {
        userMessage: rawMessage,
        replyText,
        jevResult,
        editorAudit,
        audioUrl: audioUrlSent
      }
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: signedToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch (error) {
    console.error("[POST /api/trial Error]", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Şu anda tefekkür odasında yoğunluk yaşanıyor, lütfen biraz sonra tekrar deneyin."
      },
      { status: 500 }
    );
  }
}
