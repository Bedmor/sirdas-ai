import { prisma } from "@/lib/db/prisma";
import { WhatsAppClient } from "@/lib/whatsapp/client";
import {
  analyzeWithJev,
  JevAnalysisResult,
  TonePreference,
  SpiritualStage,
} from "./jev-client";
import { generateEmbedding } from "./embeddings";
import { generateSirdasReply } from "./gemini-client";
import { handleOnboardingMessage } from "@/lib/whatsapp/onboarding";
import { SirdasOutput } from "./schemas";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import {
  evaluateSpiritualGuardrails,
  retrieveCelikKasaContext,
  persistConversationTurn,
  UnifiedEditorAudit,
} from "./rag-pipeline";

export interface IncomingMessagePayload {
  phoneNumber: string;
  text: string;
  messageId: string;
}

export interface OrchestrationResult {
  status:
    | "idempotent_skipped"
    | "onboarding"
    | "fatwa_blocked"
    | "crisis_redirected"
    | "processed";
  replyText?: string;
  audioSent?: boolean;
  audioUrlSent?: string | null;
  editorAudit?: UnifiedEditorAudit | SirdasOutput["editor_audit"];
  jevResult?: JevAnalysisResult;
}

export const VALID_TONES: TonePreference[] = [
  "SEFKATLI_TESKIN",
  "DIRILIS_VE_GAYRET",
  "NET_VE_MUALLIM",
  "HIKMETLI_SUKUT",
  "TAVIZSIZ_MUALLIM",
];

interface StoredUserProfile {
  roles?: string[];
  spiritual_trials?: string[];
  tone_preference?: TonePreference;
  spiritual_stage?: SpiritualStage;
  [key: string]: unknown;
}

export async function processIncomingMessage(
  payload: IncomingMessagePayload
): Promise<OrchestrationResult> {
  const { phoneNumber, text, messageId } = payload;
  const wa = new WhatsAppClient();

  // 0. Retry Storm Idempotency Check
  const existingMessage = await prisma.message.findUnique({
    where: { waMessageId: messageId },
  });
  if (existingMessage) {
    console.log(`[Idempotency] ${messageId} daha önce işlenmiş, atlanıyor.`);
    return { status: "idempotent_skipped" };
  }

  // Rate Limit: Max 15 messages per minute per phone number
  const rateLimit = checkRateLimit(`wa_${phoneNumber}`, 15, 60_000);
  if (!rateLimit.allowed) {
    const rateMsg =
      "Kıymetli dostum, mesajların çok hızlı iletildi. Birkaç saniye sükûnetle bekledikten sonra tekrar yazabilirsin.";
    await wa.sendTextMessage(phoneNumber, rateMsg);
    return { status: "processed", replyText: rateMsg };
  }

  await wa.markAsRead(messageId).catch(() => {});

  // 1. User Lookup & Onboarding ("4 Bloklu Dijital İkiz")
  let user = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phoneNumber,
        onboardingStep: 1,
        onboardingCompleted: false,
        profileMetadata: {},
      },
    });
  }

  // KVKK / Privacy Reset Command ("Hafızamı Sıfırla" / "Verilerimi Sil")
  const normalizedLower = text.trim().toLowerCase();
  const isResetCommand =
    /^(haf[ıi]zam[ıi]\s*s[ıi]f[ıi]rla|verilerimi\s*sil|profilimi\s*s[ıi]f[ıi]rla|bastan\s*basla|baştan\s*başla)$/i.test(
      normalizedLower
    );
  if (isResetCommand) {
    await prisma.message.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStep: 1,
        onboardingCompleted: false,
        profileMetadata: {},
      },
    });
    const resetMsg =
      "Talebine hürmetle geçmiş sohbet kayıtların ve dijital künyen tamamen silindi aziz kardeşim. Dilediğin an 'Selamun aleykum' yazarak yeni bir tefekkür yolculuğu başlatabilirsin.";
    await wa.sendTextMessage(phoneNumber, resetMsg);
    return { status: "processed", replyText: resetMsg };
  }

  if (!user.onboardingCompleted) {
    await handleOnboardingMessage(user, text, messageId, wa);
    return { status: "onboarding" };
  }

  // 2. System 1 (Jev) Reflex Analysis (0ms local heuristic)
  const jevResult = await analyzeWithJev({
    userMessage: text,
    userContextSnippet: JSON.stringify(user.profileMetadata),
  });

  // 3. Canonical 3-Tier Spiritual & Safety Guardrail Evaluation (before spending Embedding/LLM tokens)
  const intercept = evaluateSpiritualGuardrails(text, jevResult);
  if (intercept) {
    await wa.sendTextMessage(phoneNumber, intercept.replyText);

    await persistConversationTurn({
      userId: user.id,
      waMessageId: messageId,
      userMessage: text,
      replyText: intercept.replyText,
      jevResult,
      editorAudit: intercept.editorAudit,
      extraFlags: intercept.extraFlags,
    });

    return {
      status: intercept.status,
      replyText: intercept.replyText,
      editorAudit: intercept.editorAudit,
      jevResult,
    };
  }

  // 4. TonePreference & SpiritualStage Resolution + High-Distress Softening
  const userMetadata: StoredUserProfile =
    user.profileMetadata && typeof user.profileMetadata === "object" && !Array.isArray(user.profileMetadata)
      ? (user.profileMetadata as StoredUserProfile)
      : {};

  const preferredTone = userMetadata.tone_preference;
  let effectiveTone: TonePreference =
    preferredTone && VALID_TONES.includes(preferredTone)
      ? preferredTone
      : jevResult.recommended_tone || "SEFKATLI_TESKIN";

  let effectiveStage: SpiritualStage =
    userMetadata.spiritual_stage ||
    jevResult.spiritual_stage ||
    "ARAYIS_VE_BASLANGIC";

  if (jevResult.distress_level >= 8) {
    effectiveTone = "SEFKATLI_TESKIN";
    effectiveStage = "DARLIK_VE_BUNALIM";
  }

  // 5. Çelik Kasa Hybrid RAG Retrieval
  const queryEmbedding = await generateEmbedding(text);
  const { chunks, isRibaShieldActive } = await retrieveCelikKasaContext({
    userMessage: text,
    queryEmbedding,
    jevResult,
  });

  // 6. Gemini 2.5 Flash (System 2) - Internal Spiritual Editor + Author
  const sirdasReply: SirdasOutput = await generateSirdasReply({
    userMessage: text,
    userProfile: userMetadata,
    effectiveTone,
    spiritualStage: effectiveStage,
    distressLevel: jevResult.distress_level,
    isRibaShieldActive,
    nafsTrap: jevResult.nafs_trap,
    ragCategory: jevResult.rag_category,
    ragChunks: chunks,
  });

  // 7. WhatsApp Delivery (Text + Optional .ogg Audio Snippet)
  await wa.sendTextMessage(phoneNumber, sirdasReply.whatsapp_reply);

  let audioSent = false;
  let audioUrlSent: string | null = null;

  if (
    jevResult.needs_audio_snippet >= 0.7 &&
    sirdasReply.selected_audio_chunk_id
  ) {
    const matchedChunk = chunks.find(
      (c) => c.id === sirdasReply.selected_audio_chunk_id
    );
    if (matchedChunk && matchedChunk.audioUrl) {
      try {
        await wa.sendAudioMessage(phoneNumber, matchedChunk.audioUrl);
        audioSent = true;
        audioUrlSent = matchedChunk.audioUrl;
      } catch (audioErr) {
        console.error(
          "[WhatsApp Audio Delivery Failed - Continuing with text only]",
          audioErr
        );
      }
    }
  }

  // 8. Atomic DB & Digital Twin Profile Update
  const updatedProfile: StoredUserProfile = { ...userMetadata };
  if (sirdasReply.profile_updates) {
    if (sirdasReply.profile_updates.new_roles?.length) {
      updatedProfile.roles = Array.from(
        new Set([
          ...(updatedProfile.roles || []),
          ...sirdasReply.profile_updates.new_roles,
        ])
      );
    }
    if (sirdasReply.profile_updates.new_weaknesses?.length) {
      updatedProfile.spiritual_trials = Array.from(
        new Set([
          ...(updatedProfile.spiritual_trials || []),
          ...sirdasReply.profile_updates.new_weaknesses,
        ])
      );
    }
    if (sirdasReply.profile_updates.spiritual_stage) {
      updatedProfile.spiritual_stage =
        sirdasReply.profile_updates.spiritual_stage;
    }
    if (sirdasReply.profile_updates.tone_preference) {
      updatedProfile.tone_preference =
        sirdasReply.profile_updates.tone_preference;
    }
  }

  await persistConversationTurn({
    userId: user.id,
    waMessageId: messageId,
    userMessage: text,
    replyText: sirdasReply.whatsapp_reply,
    jevResult,
    editorAudit: sirdasReply.editor_audit,
    ragChunkIds: chunks.map((c) => c.id),
    audioSent,
    audioUrlSent,
    updatedUserProfile: updatedProfile,
  });

  return {
    status: "processed",
    replyText: sirdasReply.whatsapp_reply,
    audioSent,
    audioUrlSent,
    editorAudit: sirdasReply.editor_audit,
    jevResult,
  };
}
