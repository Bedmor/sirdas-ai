import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getLocalKnowledgeCorpus, isRemoteDbOffline } from "@/lib/db/local-corpus";
import { analyzeWithJev, JevAnalysisResult } from "@/lib/ai/jev-client";
import { generateEmbedding } from "@/lib/ai/embeddings";
import {
  ConversationHistoryTurn,
  generateSirdasReply,
  generateSirdasReplyStream,
  StreamReplyResult,
} from "@/lib/ai/gemini-client";
import {
  evaluateSpiritualGuardrails,
  filterUsedSourcesByReply,
  retrieveCelikKasaContext,
  UnifiedEditorAudit,
} from "@/lib/ai/rag-pipeline";
import {
  dispatchBackgroundTriage,
  extractUserProfileFactsFromText,
  mergeUserProfileMetadata,
  PersistentUserProfile,
} from "@/lib/ai/semantic-triage";
import { detectChatIntent, ChatIntentMode } from "@/lib/ai/intent-router";
import { sanitizeIncomingUserMessage } from "@/lib/ai/pii-anonymizer";
import {
  resolveSirdasChatActor,
  purgeSirdasActorData,
  purgeExpiredSirdasRecords,
  SIRDAS_CLIENT_COOKIE,
} from "@/lib/auth/better-auth-ready";
import {
  appendSafetyFootnote,
  isSafetyTriageRule,
  resolveSafetyNotice,
  runSafetyTriage,
} from "@/lib/safety/triage";
import { buildSafetyIntercept } from "@/lib/safety/intercept";
import { geceGecSaatMi } from "@/lib/uslup/siniflandirici";

type GuardrailFlags = Record<string, boolean>;

export interface ChatSourceMeta {
  id: string;
  sourceType: string;
  sourceTitle: string;
  content?: string;
  audioUrl?: string | null;
}

async function persistChatTurn(params: {
  userKey: string;
  conversationId: string;
  rawMessage: string;
  replyText: string;
  jevResult: JevAnalysisResult;
  userProfile: PersistentUserProfile;
  editorAudit: UnifiedEditorAudit | Record<string, unknown>;
  ragChunkIds: string[];
  audioUrlSent: string | null;
  extraFlags?: GuardrailFlags;
}) {
  const {
    userKey,
    conversationId,
    rawMessage,
    replyText,
    jevResult,
    userProfile,
    editorAudit,
    ragChunkIds,
    audioUrlSent,
    extraFlags,
  } = params;

  const serializedProfile = JSON.parse(JSON.stringify(userProfile));
  const nextStep =
    typeof userProfile.onboarding_step === "number"
      ? userProfile.onboarding_step
      : 1;
  const nextCompleted = Boolean(userProfile.onboarding_completed);

  const user = await prisma.user.upsert({
    where: { phoneNumber: userKey },
    update: {
      lastActiveAt: new Date(),
      onboardingStep: nextStep,
      onboardingCompleted: nextCompleted,
      profileMetadata: serializedProfile,
    },
    create: {
      phoneNumber: userKey,
      onboardingStep: nextStep,
      onboardingCompleted: nextCompleted,
      profileMetadata: serializedProfile,
    },
  });

  const userMsg = await prisma.message.create({
    data: {
      userId: user.id,
      role: "USER",
      content: rawMessage,
      jevMetadata: JSON.parse(
        JSON.stringify({
          ...jevResult,
          source: "web_sirdas_chat",
          conversationId,
          ...(extraFlags || {}),
        })
      ),
    },
  });

  const assistantMsg = await prisma.message.create({
    data: {
      userId: user.id,
      role: "ASSISTANT",
      content: replyText,
      ragChunkIds,
      jevMetadata: JSON.parse(
        JSON.stringify({
          ...jevResult,
          source: "web_sirdas_chat",
          conversationId,
          ...(extraFlags || {}),
        })
      ),
      editorAudit: JSON.parse(
        JSON.stringify({
          ...editorAudit,
          conversationId,
        })
      ),
      audioSent: Boolean(audioUrlSent),
      audioUrlSent,
    },
  });

  // Asenkron derin semantik triyaj:
  // Kullanıcının yanıtı teslim edildi (0ms gecikme etkisi), arka planda
  // gemini-3.5-flash-lite ile zengin profil analizi ve teşhis raporlaması yapılır.
  if (
    rawMessage &&
    !extraFlags?.bypassed_to_fatwa_block &&
    !extraFlags?.crisis_redirect &&
    !extraFlags?.bypassed_to_violence_block
  ) {
    dispatchBackgroundTriage({
      userKey,
      assistantMessageId: assistantMsg.id,
      userMessageId: userMsg.id,
      userMessage: rawMessage,
    });
  }
}

/**
 * GET /api/chat
 * Returns the active visitor/user identity and optionally messages for a thread.
 */
export async function GET(req: NextRequest) {
  try {
    const actor = resolveSirdasChatActor(req);
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    const userKey = `web_chat_${actor.clientId}`;

    // 3. Zaman Ayarlı Kendini İmhâ (TTL): Yalnızca kullanıcı açıkça TTL seçtiyse (>0) çalıştır;
    // varsayılan olarak web kullanıcıları kalıcı (gerçek) hesap statüsündedir (ttlHours = 0).
    const ttlParam = req.nextUrl.searchParams.get("ttlHours");
    const ttlHours = ttlParam !== null ? Math.max(0, Number(ttlParam)) : 0;
    if (ttlHours > 0) {
      purgeExpiredSirdasRecords(ttlHours).catch(() => {});
    }

    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: userKey },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    const filteredMessages = (existingUser?.messages || []).filter((m) => {
      if (!conversationId) return true;
      const meta = (m.jevMetadata || m.editorAudit) as
        | { conversationId?: string }
        | null;
      return !meta?.conversationId || meta.conversationId === conversationId;
    });

    const res = NextResponse.json({
      success: true,
      clientId: actor.clientId,
      isAnonymous: actor.isAnonymous,
      userProfile: existingUser?.profileMetadata || null,
      onboardingStep: existingUser?.onboardingStep ?? 1,
      onboardingCompleted: existingUser?.onboardingCompleted ?? false,
      messages: filteredMessages.map((m) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
        audioUrl: m.audioUrlSent,
        editorAudit: m.editorAudit,
        createdAt: m.createdAt,
      })),
    });

    res.cookies.set(SIRDAS_CLIENT_COOKIE, actor.clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  } catch (err) {
    console.error("[GET /api/chat Error]", err);
    return NextResponse.json({
      success: true,
      userProfile: null,
      messages: [],
    });
  }
}

/**
 * PATCH /api/chat
 * Kullanıcının "Sırdaş Profilim & Manevi Seyir" ekranından hitap adını,
 * hayat rollerini veya üslup tercihini doğrudan güncellemesini sağlar.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const actor = resolveSirdasChatActor(req, body.clientId);
    const userKey = `web_chat_${actor.clientId}`;

    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: userKey },
      select: { profileMetadata: true },
    });

    const currentMeta =
      existingUser?.profileMetadata &&
      typeof existingUser.profileMetadata === "object"
        ? (existingUser.profileMetadata as Record<string, unknown>)
        : {};

    const updatedRoles = Array.isArray(body.roles)
      ? body.roles.filter((r: unknown) => typeof r === "string")
      : Array.isArray(currentMeta.roles)
        ? (currentMeta.roles as string[])
        : [];

    const updatedFacts = Array.isArray(body.known_facts)
      ? body.known_facts.filter((f: unknown) => typeof f === "string")
      : Array.isArray(currentMeta.known_facts)
        ? (currentMeta.known_facts as string[])
        : [];

    const preferredName =
      typeof body.preferred_name === "string"
        ? body.preferred_name.trim() || undefined
        : typeof currentMeta.preferred_name === "string"
          ? currentMeta.preferred_name
          : undefined;

    const merged = mergeUserProfileMetadata({
      existingMeta: {
        ...currentMeta,
        ...(preferredName ? { preferred_name: preferredName } : {}),
        ...(body.tone_preference
          ? { tone_preference: body.tone_preference }
          : {}),
        ...(body.spiritual_stage
          ? { spiritual_stage: body.spiritual_stage }
          : {}),
        roles: updatedRoles,
        known_facts: updatedFacts,
      },
    });

    const serialized = JSON.parse(JSON.stringify(merged));
    await prisma.user.upsert({
      where: { phoneNumber: userKey },
      update: {
        lastActiveAt: new Date(),
        onboardingStep: merged.onboarding_step,
        onboardingCompleted: merged.onboarding_completed,
        profileMetadata: serialized,
      },
      create: {
        phoneNumber: userKey,
        onboardingStep: merged.onboarding_step,
        onboardingCompleted: merged.onboarding_completed,
        profileMetadata: serialized,
      },
    });

    return NextResponse.json({
      success: true,
      userProfile: merged,
    });
  } catch (err) {
    console.error("[PATCH /api/chat Error]", err);
    return NextResponse.json(
      { error: "PROFILE_UPDATE_FAILED" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * Multi-turn Manevi Pusula contemplation endpoint with SSE streaming,
 * Çelik Kasa RAG source citations, Halis Aydemir audio snippets,
 * and Better Auth anonymous/authenticated session readiness.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Sayfayı/Uygulamayı Kapattığı An (Browser Close Event - Beacon Purge)
    const action = req.nextUrl.searchParams.get("action");
    if (action === "purge" || body.action === "purge") {
      const actor = resolveSirdasChatActor(req, body.clientId);
      const purgeResult = await purgeSirdasActorData(actor.clientId);
      const res = NextResponse.json({
        success: purgeResult.deleted,
        message: "Oturum sonlandırıldı, benlik hafızası milisaniyeler içinde imha edildi.",
        purged: true,
      });
      res.cookies.delete(SIRDAS_CLIENT_COOKIE);
      return res;
    }

    const rawMessage =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!rawMessage || rawMessage.length < 2) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message:
            "Lütfen gönlünüzü meşgul eden durumu birkaç kelimeyle ifade edin.",
        },
        { status: 400 }
      );
    }

    if (rawMessage.length > 1200) {
      return NextResponse.json(
        {
          error: "MESSAGE_TOO_LONG",
          message: "Mesajınız en fazla 1200 karakter olabilir.",
        },
        { status: 400 }
      );
    }

    // PII & Dolaylı Kimlik Maskeleme Süzgeci
    const anonymization = sanitizeIncomingUserMessage(rawMessage);
    const safeMessage = anonymization.sanitizedText;

    const actor = resolveSirdasChatActor(req, body.clientId);
    const conversationId =
      typeof body.conversationId === "string" && body.conversationId.trim()
        ? body.conversationId.trim()
        : crypto.randomUUID();
    const userKey = `web_chat_${actor.clientId}`;

    // KVKK Unutulma Hakkı Chat Komutu Kontrolü ("Hafızamı Sıfırla" / "Tüm Verilerimi Sil")
    const lowerMessage = rawMessage.toLowerCase().trim();
    const isResetCommand =
      /^(haf[ıi]zam[ıi]\s*s[ıi]f[ıi]rla|haf[ıi]zam[ıi]\s*sil|verilerimi\s*sil|t[üu]m\s*verilerimi\s*sil|benlik\s*haf[ıi]zam[ıi]\s*s[ıi]f[ıi]rla|unutulma\s*hakk[ıi])$/i.test(
        lowerMessage
      );

    if (isResetCommand) {
      await purgeSirdasActorData(actor.clientId);
      const resetReply =
        "KVKK Unutulma Hakkı kapsamında talebinizle geçmiş tüm sohbet kayıtlarınız, 4 bloklu dijital künyeniz ve benlik hafızanız (JSON kaydı) kalıcı olarak silindi aziz kardeşim. Dilediğiniz vakit yeni bir tefekkür yolculuğu başlatabilirsiniz.";

      return NextResponse.json({
        success: true,
        status: "processed",
        conversationId,
        clientId: actor.clientId,
        replyText: resetReply,
        sources: [],
        audioUrl: null,
        purged: true,
      });
    }

    // Deterministik güvenlik ön süzgeci (kriz, sağlık, çocuk yaşı, fetva sınırı).
    // Modelden önce, yalnızca bu istekteki mesaj üzerinde yerel olarak çalışır.
    const safetyTriage = runSafetyTriage(rawMessage);

    const rawHistory: unknown[] = Array.isArray(body.history)
      ? body.history
      : [];
    const validRawHistory = rawHistory.filter(
      (item: unknown): item is { role: string; content: string } =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as { content?: unknown }).content === "string"
        )
    );

    // Gece Geç Saat + Mesaj Sınırı Birlikte Kontrolü (Tatlı Fesih Tespiti)
    const resolveUserLocalTime = (): { hour: number; minute: number } => {
      if (
        typeof body.localHour === "number" &&
        body.localHour >= 0 &&
        body.localHour <= 23
      ) {
        const minute =
          typeof body.localMinute === "number" &&
          body.localMinute >= 0 &&
          body.localMinute <= 59
            ? body.localMinute
            : 30;
        return { hour: body.localHour, minute };
      }
      try {
        const tz =
          typeof body.timeZone === "string" && body.timeZone.trim()
            ? body.timeZone.trim()
            : "Europe/Istanbul";
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        }).formatToParts(new Date());
        const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12) % 24;
        const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
        return { hour: h, minute: m };
      } catch {
        const now = new Date();
        return { hour: now.getHours(), minute: now.getMinutes() };
      }
    };

    const { hour: userLocalHour, minute: userLocalMinute } =
      resolveUserLocalTime();
    const isLateNightTime = geceGecSaatMi(userLocalHour, userLocalMinute);

    const historyUserMsgCount =
      validRawHistory.filter((item) => item.role === "user").length + 1;
    const reportedUserMsgCount =
      typeof body.sessionUserMessagesCount === "number"
        ? body.sessionUserMessagesCount
        : historyUserMsgCount;
    const effectiveUserMsgCount = Math.max(
      historyUserMsgCount,
      reportedUserMsgCount
    );

    // Hem gece saati (00:30 - 04:59) hem de mesaj sınırı (>= 10 mesaj) birlikte sağlanmalı
    const isLateNightEscapeCandidate =
      isLateNightTime && effectiveUserMsgCount >= 10;

    // Veri saklanmayan geçici (stateless / ephemeral) oturum modu kontrolü
    const isEphemeralSession = body.ephemeralSession === true;

    // Kalıcı Kullanıcı Künyesi (Persistent Memory):
    // Veritabanındaki User.profileMetadata kaydını oku ve mevcut/geçmiş mesajlardaki
    // hitap ismi ("Adım Ahmet"), rol ("EVLI", "ESNAF") ve yaşam olgularıyla birleştir.
    // Veri saklanmasa dahi (isEphemeralSession veya DB kapalı), oturum içi ruh hali ve
    // tonlama esnekliği RAM'deki geçici bağlam üzerinden eksiksiz çalışır.
    let existingProfileMeta: Record<string, unknown> | null =
      body.userProfile && typeof body.userProfile === "object"
        ? (body.userProfile as Record<string, unknown>)
        : null;

    if (!isEphemeralSession) {
      try {
        const existingUserRecord = await prisma.user.findUnique({
          where: { phoneNumber: userKey },
          select: { profileMetadata: true },
        });
        if (
          existingUserRecord?.profileMetadata &&
          typeof existingUserRecord.profileMetadata === "object"
        ) {
          existingProfileMeta = {
            ...(existingProfileMeta || {}),
            ...(existingUserRecord.profileMetadata as Record<string, unknown>),
          };
        }
      } catch {
        // Fallback gracefully if DB query fails
      }
    }

    // Tüm geçmiş kullanıcı mesajlarından ve yeni mesajdan senkron (0ms) bilgi çıkarımı
    const combinedUserCorpus = [
      ...validRawHistory
        .filter((item) => item.role === "user")
        .map((item) => item.content),
      rawMessage,
    ].join(" . ");
    const latestTurnFacts = extractUserProfileFactsFromText(rawMessage);
    const historyFacts = extractUserProfileFactsFromText(combinedUserCorpus);
    const extractedProfileFacts = {
      preferred_name:
        latestTurnFacts.preferred_name || historyFacts.preferred_name,
      roles: Array.from(
        new Set([...historyFacts.roles, ...latestTurnFacts.roles])
      ),
      known_facts: Array.from(
        new Set([...historyFacts.known_facts, ...latestTurnFacts.known_facts])
      ),
      biological_energy: latestTurnFacts.biological_energy,
      progressed_stage:
        latestTurnFacts.progressed_stage || historyFacts.progressed_stage,
      progressed_tone: latestTurnFacts.progressed_tone,
    };

    let conversationHistory: ConversationHistoryTurn[] = validRawHistory
      .slice(-6)
      .map((item: { role: string; content: string }) => ({
        role: item.role === "user" ? "user" : "assistant",
        content: item.content.trim(),
      }));

    if (!isEphemeralSession && conversationHistory.length === 0) {
      try {
        const dbMessages = await prisma.message.findMany({
          where: {
            user: { phoneNumber: userKey },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        });
        conversationHistory = dbMessages
          .reverse()
          .map((m) => ({
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content.trim(),
          }));
      } catch {
        // Fallback gracefully
      }
    }

    const acceptHeader = req.headers.get("accept") || "";
    const isSseRequested =
      acceptHeader.includes("text/event-stream") || body.stream !== false;

    if (isSseRequested) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let accumulatedReply = "";
          let editorAudit: UnifiedEditorAudit | Record<string, unknown> | null =
            null;
          let audioUrlSent: string | null = null;
          let statusType: "processed" | "fatwa_blocked" | "crisis_redirected" =
            "processed";
          let jevResult: JevAnalysisResult | null = null;
          let ragChunkIds: string[] = [];
          let sources: ChatSourceMeta[] = [];
          let extraFlags: GuardrailFlags | undefined;

          try {
            jevResult = await analyzeWithJev({
              userMessage: safeMessage,
              sessionHistory: conversationHistory,
              userContextSnippet: JSON.stringify({
                source: "web_sirdas_chat",
                recentTurnsCount: conversationHistory.length,
              }),
            });

            // Akıllı Niyet Yönlendirmesi (Intent Routing)
            const intentResult = detectChatIntent(safeMessage, jevResult);
            const intentMode = intentResult.mode;

            if (intentMode === "ILIM_VE_SIYER") {
              jevResult.rag_category = "SIYER_ORNEKLERI";
              jevResult.recommended_tone = "NET_VE_MUALLIM";
              jevResult.distress_level = Math.min(jevResult.distress_level, 3);
            }

            const activeUserProfile = mergeUserProfileMetadata({
              existingMeta: existingProfileMeta,
              extractedFacts: extractedProfileFacts,
              jevResult,
            });

            const intercept =
              buildSafetyIntercept(safetyTriage, jevResult) ??
              evaluateSpiritualGuardrails(safeMessage, jevResult);

            if (intercept) {
              statusType = intercept.status;
              editorAudit = intercept.editorAudit;
              extraFlags = intercept.extraFlags;
              if (
                intercept.status === "processed" &&
                intercept.ruleId !== "CONVERSATIONAL_CLOSING_THANKS" &&
                !isSafetyTriageRule(intercept.ruleId)
              ) {
                const matchedVaultChunks = filterUsedSourcesByReply(
                  getLocalKnowledgeCorpus(),
                  intercept.replyText
                );
                ragChunkIds = matchedVaultChunks.map((c) => c.id);
                sources = matchedVaultChunks.map((c) => ({
                  id: c.id,
                  sourceType: c.sourceType,
                  sourceTitle: c.sourceTitle,
                  content: c.content,
                  audioUrl: c.audioUrl ?? null,
                }));
              } else {
                sources = [];
              }

              const metaFrame = `event: meta\ndata: ${JSON.stringify({
                conversationId,
                status: statusType,
                intentMode,
                jevResult,
                sources: [],
                safety: resolveSafetyNotice(safetyTriage, statusType),
              })}\n\n`;
              controller.enqueue(encoder.encode(metaFrame));

              const interceptReply = appendSafetyFootnote(
                intercept.replyText,
                safetyTriage
              );
              const tokens = interceptReply.match(/\S+\s*/g) || [
                interceptReply,
              ];
              for (const token of tokens) {
                accumulatedReply += token;
                const frame = `event: token\ndata: ${JSON.stringify({
                  token,
                  text: accumulatedReply,
                })}\n\n`;
                controller.enqueue(encoder.encode(frame));
              }
            } else {
              const queryEmbedding = isRemoteDbOffline()
                ? new Array(768).fill(0)
                : await generateEmbedding(safeMessage);
              const { chunks, isRibaShieldActive } =
                await retrieveCelikKasaContext({
                  userMessage: safeMessage,
                  queryEmbedding,
                  jevResult,
                  intentMode,
                });

              // Akış başlarken henüz üretilmiş yanıt metni olmadığından kullanılmamış aday kaynakları gösterme
              const metaFrame = `event: meta\ndata: ${JSON.stringify({
                conversationId,
                status: statusType,
                intentMode,
                jevResult,
                sources: [],
                safety: resolveSafetyNotice(safetyTriage, statusType),
              })}\n\n`;
              controller.enqueue(encoder.encode(metaFrame));

              const resolvedTone =
                intentMode === "ILIM_VE_SIYER"
                  ? "NET_VE_MUALLIM"
                  : jevResult.session_mood === "OFKELI_VE_GERGIN"
                    ? "SAKINLESTIRICI_VE_VAKUR"
                    : jevResult.session_mood === "HUZUNLU_VE_KIRGIN" ||
                        jevResult.distress_level >= 8
                      ? "SEFKATLI_TESKIN"
                      : activeUserProfile.tone_preference ||
                        jevResult.recommended_tone ||
                        "SEFKATLI_TESKIN";
              const resolvedStage =
                jevResult.distress_level >= 8
                  ? "DARLIK_VE_BUNALIM"
                  : activeUserProfile.spiritual_stage ||
                    jevResult.spiritual_stage ||
                    "ARAYIS_VE_BASLANGIC";

              const isLateNightDismissal =
                isLateNightEscapeCandidate && jevResult.distress_level < 10;

              const streamGenerator = generateSirdasReplyStream({
                userMessage: safeMessage,
                userProfile: activeUserProfile,
                effectiveTone: resolvedTone,
                sessionMood: jevResult.session_mood,
                spiritualStage: resolvedStage,
                distressLevel: jevResult.distress_level,
                isRibaShieldActive,
                isLateNightDismissal,
                isLateNightHour: isLateNightTime,
                sessionUserMessageCount: effectiveUserMsgCount,
                nafsTrap: jevResult.nafs_trap,
                ragCategory: jevResult.rag_category,
                ragChunks: chunks,
                conversationHistory,
                intentMode,
              });

              let streamFinalResult: StreamReplyResult | null = null;

              while (true) {
                const nextChunk = await streamGenerator.next();
                if (nextChunk.done) {
                  streamFinalResult = nextChunk.value;
                  break;
                }
                const token = nextChunk.value;
                accumulatedReply += token;
                const frame = `event: token\ndata: ${JSON.stringify({
                  token,
                  text: accumulatedReply,
                })}\n\n`;
                controller.enqueue(encoder.encode(frame));
              }

              // Fetva sınırı / sağlık dipnotu (yanıtta yoksa) akışın sonuna eklenir
              const footnotedReply = appendSafetyFootnote(
                accumulatedReply,
                safetyTriage
              );
              if (footnotedReply !== accumulatedReply) {
                const noteToken = `\n\n${safetyTriage?.footnote ?? ""}`;
                accumulatedReply = footnotedReply;
                controller.enqueue(
                  encoder.encode(
                    `event: token\ndata: ${JSON.stringify({
                      token: noteToken,
                      text: accumulatedReply,
                    })}\n\n`
                  )
                );
              }

              // Sadece AI'ın ürettiği nihai cevap metniyle gerçekten örtüşen / atıf yapılan kaynakları göster
              const usedChunks = filterUsedSourcesByReply(
                chunks,
                accumulatedReply
              );
              ragChunkIds = usedChunks.map((c) => c.id);
              sources = usedChunks.map((c) => ({
                id: c.id,
                sourceType: c.sourceType,
                sourceTitle: c.sourceTitle,
                content: c.content,
                audioUrl: c.audioUrl ?? null,
              }));

              if (streamFinalResult?.selectedAudioChunkId) {
                const found = usedChunks.find(
                  (c) => c.id === streamFinalResult?.selectedAudioChunkId
                );
                audioUrlSent = found?.audioUrl ?? null;
              } else {
                audioUrlSent = null;
              }

              editorAudit = streamFinalResult?.editorAudit || {
                murakabe_applied: true,
                ilahi_riza_checked: true,
                tevekkul_and_talak_hope_included: true,
                nafs_and_vesvese_addressed: jevResult.nafs_trap,
                siyer_example_used:
                  sources[0]?.sourceTitle || "Samimi Manevi Hasbihal",
                riba_warning_included: isRibaShieldActive,
                nafs_trap: jevResult.nafs_trap,
                rag_category: jevResult.rag_category,
                distress_level: jevResult.distress_level,
                tone: resolvedTone,
                session_mood: jevResult.session_mood,
                spiritual_stage: resolvedStage,
              };
            }

            if (!isEphemeralSession) {
              try {
                await persistChatTurn({
                  userKey,
                  conversationId,
                  rawMessage: safeMessage,
                  replyText: accumulatedReply,
                  jevResult,
                  userProfile: activeUserProfile,
                  editorAudit: editorAudit || {},
                  ragChunkIds,
                  audioUrlSent,
                  extraFlags,
                });
              } catch (dbErr) {
                console.warn("[POST /api/chat DB Persistence Warning]", dbErr);
              }
            }

            const donePayload = JSON.stringify({
              success: true,
              status: statusType,
              conversationId,
              clientId: actor.clientId,
              replyText: accumulatedReply,
              intentMode,
              jevResult,
              userProfile: activeUserProfile,
              editorAudit,
              sources,
              audioUrl: audioUrlSent,
              safety: resolveSafetyNotice(safetyTriage, statusType),
            });
            controller.enqueue(
              encoder.encode(`event: done\ndata: ${donePayload}\n\n`)
            );
            controller.close();
          } catch (streamErr) {
            console.error("[POST /api/chat Stream Error]", streamErr);
            const errPayload = JSON.stringify({
              error: "INTERNAL_ERROR",
              message:
                "Şu anda tefekkür odasında yoğunluk yaşanıyor, lütfen biraz sonra tekrar deneyin.",
            });
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${errPayload}\n\n`)
            );
            controller.close();
          }
        },
      });

      const response = new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });

      response.cookies.set(SIRDAS_CLIENT_COOKIE, actor.clientId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      return response;
    }

    // Non-streaming JSON mode
    const jevResult = await analyzeWithJev({
      userMessage: safeMessage,
      sessionHistory: conversationHistory,
      userContextSnippet: JSON.stringify({
        source: "web_sirdas_chat",
        recentTurnsCount: conversationHistory.length,
      }),
    });

    // Akıllı Niyet Yönlendirmesi (Intent Routing)
    const intentResult = detectChatIntent(safeMessage, jevResult);
    const intentMode = intentResult.mode;

    if (intentMode === "ILIM_VE_SIYER") {
      jevResult.rag_category = "SIYER_ORNEKLERI";
      jevResult.recommended_tone = "NET_VE_MUALLIM";
      jevResult.distress_level = Math.min(jevResult.distress_level, 3);
    }

    const activeUserProfile = mergeUserProfileMetadata({
      existingMeta: existingProfileMeta,
      extractedFacts: extractedProfileFacts,
      jevResult,
    });

    const intercept =
      buildSafetyIntercept(safetyTriage, jevResult) ??
      evaluateSpiritualGuardrails(safeMessage, jevResult);
    let replyText = "";
    let editorAudit: UnifiedEditorAudit | Record<string, unknown>;
    let audioUrlSent: string | null = null;
    let statusType: "processed" | "fatwa_blocked" | "crisis_redirected" =
      "processed";
    let ragChunkIds: string[] = [];
    let sources: ChatSourceMeta[] = [];
    let extraFlags: GuardrailFlags | undefined;

    if (intercept) {
      statusType = intercept.status;
      replyText = appendSafetyFootnote(intercept.replyText, safetyTriage);
      editorAudit = intercept.editorAudit;
      extraFlags = intercept.extraFlags;
      if (
        intercept.status === "processed" &&
        intercept.ruleId !== "CONVERSATIONAL_CLOSING_THANKS" &&
        !isSafetyTriageRule(intercept.ruleId)
      ) {
        const matchedVaultChunks = filterUsedSourcesByReply(
          getLocalKnowledgeCorpus(),
          intercept.replyText
        );
        ragChunkIds = matchedVaultChunks.map((c) => c.id);
        sources = matchedVaultChunks.map((c) => ({
          id: c.id,
          sourceType: c.sourceType,
          sourceTitle: c.sourceTitle,
          content: c.content,
          audioUrl: c.audioUrl ?? null,
        }));
      } else {
        sources = [];
      }
    } else {
      const queryEmbedding = isRemoteDbOffline()
        ? new Array(768).fill(0)
        : await generateEmbedding(safeMessage);
      const { chunks, isRibaShieldActive } = await retrieveCelikKasaContext({
        userMessage: safeMessage,
        queryEmbedding,
        jevResult,
        intentMode,
      });

      const resolvedTone =
        intentMode === "ILIM_VE_SIYER"
          ? "NET_VE_MUALLIM"
          : jevResult.session_mood === "OFKELI_VE_GERGIN"
            ? "SAKINLESTIRICI_VE_VAKUR"
            : jevResult.session_mood === "HUZUNLU_VE_KIRGIN" ||
                jevResult.distress_level >= 8
              ? "SEFKATLI_TESKIN"
              : activeUserProfile.tone_preference ||
                jevResult.recommended_tone ||
                "SEFKATLI_TESKIN";
      const resolvedStage =
        jevResult.distress_level >= 8
          ? "DARLIK_VE_BUNALIM"
          : activeUserProfile.spiritual_stage ||
            jevResult.spiritual_stage ||
            "ARAYIS_VE_BASLANGIC";

      const isLateNightDismissal =
        isLateNightEscapeCandidate && jevResult.distress_level < 10;

      const sirdasOutput = await generateSirdasReply({
        userMessage: safeMessage,
        userProfile: activeUserProfile,
        effectiveTone: resolvedTone,
        sessionMood: jevResult.session_mood,
        spiritualStage: resolvedStage,
        distressLevel: jevResult.distress_level,
        isRibaShieldActive,
        isLateNightDismissal,
        isLateNightHour: isLateNightTime,
        sessionUserMessageCount: effectiveUserMsgCount,
        nafsTrap: jevResult.nafs_trap,
        ragCategory: jevResult.rag_category,
        ragChunks: chunks,
        conversationHistory,
        intentMode,
      });

      replyText = appendSafetyFootnote(
        sirdasOutput.reply_text || sirdasOutput.whatsapp_reply || "",
        safetyTriage
      );

      // Sadece AI'ın ürettiği nihai cevap metniyle gerçekten örtüşen / atıf yapılan kaynakları göster
      const usedChunks = filterUsedSourcesByReply(chunks, replyText);
      ragChunkIds = usedChunks.map((c) => c.id);
      sources = usedChunks.map((c) => ({
        id: c.id,
        sourceType: c.sourceType,
        sourceTitle: c.sourceTitle,
        content: c.content,
        audioUrl: c.audioUrl ?? null,
      }));

      if (sirdasOutput.selected_audio_chunk_id) {
        const found = usedChunks.find(
          (c) => c.id === sirdasOutput.selected_audio_chunk_id
        );
        audioUrlSent = found?.audioUrl ?? null;
      } else {
        audioUrlSent = null;
      }
      editorAudit = {
        ...sirdasOutput.editor_audit,
        siyer_example_used:
          sources[0]?.sourceTitle ||
          sirdasOutput.editor_audit.siyer_example_used,
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: jevResult.distress_level,
        tone: resolvedTone,
        session_mood: jevResult.session_mood,
        spiritual_stage: resolvedStage,
      };
    }

    if (!isEphemeralSession) {
      try {
        await persistChatTurn({
          userKey,
          conversationId,
          rawMessage: safeMessage,
          replyText,
          jevResult,
          userProfile: activeUserProfile,
          editorAudit,
          ragChunkIds,
          audioUrlSent,
          extraFlags,
        });
      } catch (dbErr) {
        console.warn("[POST /api/chat DB Persistence Warning]", dbErr);
      }
    }

    const res = NextResponse.json({
      success: true,
      status: statusType,
      conversationId,
      clientId: actor.clientId,
      replyText,
      intentMode,
      jevResult,
      userProfile: activeUserProfile,
      editorAudit,
      sources,
      audioUrl: audioUrlSent,
      safety: resolveSafetyNotice(safetyTriage, statusType),
    });

    res.cookies.set(SIRDAS_CLIENT_COOKIE, actor.clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  } catch (error) {
    console.error("[POST /api/chat Error]", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Şu anda tefekkür odasında yoğunluk yaşanıyor.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat
 * KVKK Unutulma Hakkı (Right to be Forgotten):
 * Permanently deletes all messages, 4-block digital twin profile metadata,
 * and the user record from PostgreSQL for the active visitor or provided clientId.
 */
export async function DELETE(req: NextRequest) {
  try {
    const actor = resolveSirdasChatActor(req);
    const body = await req.json().catch(() => ({}));
    const targetClientId =
      typeof body.clientId === "string" && body.clientId.trim()
        ? body.clientId.trim()
        : actor.clientId;

    const purgeResult = await purgeSirdasActorData(targetClientId);

    const res = NextResponse.json({
      success: purgeResult.deleted,
      message:
        "Tüm sohbet geçmişiniz, dijital ikiz profil künyeniz ve sunucudaki anonim JSON kaydınız kalıcı olarak silindi.",
      clientId: targetClientId,
      messagesPurged: purgeResult.messagesCount ?? 0,
      purged: true,
    });

    res.cookies.delete(SIRDAS_CLIENT_COOKIE);
    return res;
  } catch (error) {
    console.error("[DELETE /api/chat Error]", error);
    return NextResponse.json(
      {
        error: "PURGE_FAILED",
        message: "Hafıza sıfırlama işlemi sırasında bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
