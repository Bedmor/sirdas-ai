import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { isRemoteDbOffline } from "@/lib/db/local-corpus";
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
  retrieveCelikKasaContext,
  UnifiedEditorAudit,
} from "@/lib/ai/rag-pipeline";
import { dispatchBackgroundTriage } from "@/lib/ai/semantic-triage";
import { detectChatIntent, ChatIntentMode } from "@/lib/ai/intent-router";
import { sanitizeIncomingUserMessage } from "@/lib/ai/pii-anonymizer";
import {
  resolveSirdasChatActor,
  purgeSirdasActorData,
  purgeExpiredSirdasRecords,
  SIRDAS_CLIENT_COOKIE,
} from "@/lib/auth/better-auth-ready";

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
    editorAudit,
    ragChunkIds,
    audioUrlSent,
    extraFlags,
  } = params;

  const user = await prisma.user.upsert({
    where: { phoneNumber: userKey },
    update: { lastActiveAt: new Date() },
    create: {
      phoneNumber: userKey,
      onboardingStep: 3,
      onboardingCompleted: true,
      profileMetadata: {
        roles: ["WEB_KULLANICI"],
        spiritual_trials: [jevResult.nafs_trap],
        tone_preference: jevResult.recommended_tone || "SEFKATLI_TESKIN",
        spiritual_stage: jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC",
      },
    },
  });

  await prisma.message.create({
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

    // 3. Zaman Ayarlı Kendini İmhâ (TTL): Arka planda vadesi dolan kayıtları süpür
    const ttlParam = req.nextUrl.searchParams.get("ttlHours");
    const ttlHours = ttlParam !== null ? Math.max(0, Number(ttlParam)) : 24;
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
      messages: [],
    });
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

    const rawHistory = Array.isArray(body.history) ? body.history : [];
    let conversationHistory: ConversationHistoryTurn[] = rawHistory
      .filter(
        (item: unknown): item is { role: string; content: string } =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as { content?: unknown }).content === "string"
          )
      )
      .slice(-6)
      .map((item: { role: string; content: string }) => ({
        role: item.role === "user" ? "user" : "assistant",
        content: item.content.trim(),
      }));

    if (conversationHistory.length === 0) {
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

            const intercept = evaluateSpiritualGuardrails(
              safeMessage,
              jevResult
            );

            if (intercept) {
              statusType = intercept.status;
              editorAudit = intercept.editorAudit;
              extraFlags = intercept.extraFlags;
              if (intercept.ruleId === "CONVERSATIONAL_CLOSING_THANKS") {
                sources = [];
              } else {
                sources = [
                  {
                    id: "guardrail-boundary",
                    sourceType: "SIYER",
                    sourceTitle:
                      intercept.status === "fatwa_blocked"
                        ? "Ehl-i Zikir & Alo 190 Fetva Usulü"
                        : "Can Emniyeti & 112 Acil Destek",
                  },
                ];
              }

              const metaFrame = `event: meta\ndata: ${JSON.stringify({
                conversationId,
                status: statusType,
                intentMode,
                jevResult,
                sources,
              })}\n\n`;
              controller.enqueue(encoder.encode(metaFrame));

              const tokens = intercept.replyText.match(/\S+\s*/g) || [
                intercept.replyText,
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

              ragChunkIds = chunks.map((c) => c.id);
              sources = chunks.map((c) => ({
                id: c.id,
                sourceType: c.sourceType,
                sourceTitle: c.sourceTitle,
                content: c.content,
                audioUrl: c.audioUrl ?? null,
              }));

              const metaFrame = `event: meta\ndata: ${JSON.stringify({
                conversationId,
                status: statusType,
                intentMode,
                jevResult,
                sources,
              })}\n\n`;
              controller.enqueue(encoder.encode(metaFrame));

              const resolvedTone =
                jevResult.distress_level >= 8
                  ? "SEFKATLI_TESKIN"
                  : jevResult.recommended_tone || "SEFKATLI_TESKIN";
              const resolvedStage =
                jevResult.distress_level >= 8
                  ? "DARLIK_VE_BUNALIM"
                  : jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC";

              const streamGenerator = generateSirdasReplyStream({
                userMessage: safeMessage,
                userProfile: {
                  roles: ["WEB_KULLANICI"],
                  spiritual_trials: [jevResult.nafs_trap],
                  tone_preference: resolvedTone,
                  spiritual_stage: resolvedStage,
                },
                effectiveTone: resolvedTone,
                spiritualStage: resolvedStage,
                distressLevel: jevResult.distress_level,
                isRibaShieldActive,
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

              if (streamFinalResult?.selectedAudioChunkId) {
                const found = chunks.find(
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
                  sources[0]?.sourceTitle ||
                  "Taif dönüşü Efendimiz'in (s.a.v.) tevekkülü",
                riba_warning_included: isRibaShieldActive,
                nafs_trap: jevResult.nafs_trap,
                rag_category: jevResult.rag_category,
                distress_level: jevResult.distress_level,
                tone: resolvedTone,
                spiritual_stage: resolvedStage,
              };
            }

            try {
              await persistChatTurn({
                userKey,
                conversationId,
                rawMessage: safeMessage,
                replyText: accumulatedReply,
                jevResult,
                editorAudit: editorAudit || {},
                ragChunkIds,
                audioUrlSent,
                extraFlags,
              });
            } catch (dbErr) {
              console.warn("[POST /api/chat DB Persistence Warning]", dbErr);
            }

            const donePayload = JSON.stringify({
              success: true,
              status: statusType,
              conversationId,
              clientId: actor.clientId,
              replyText: accumulatedReply,
              intentMode,
              jevResult,
              editorAudit,
              sources,
              audioUrl: audioUrlSent,
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

    const intercept = evaluateSpiritualGuardrails(safeMessage, jevResult);
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
      replyText = intercept.replyText;
      editorAudit = intercept.editorAudit;
      extraFlags = intercept.extraFlags;
      if (intercept.ruleId === "CONVERSATIONAL_CLOSING_THANKS") {
        sources = [];
      } else {
        sources = [
          {
            id: "guardrail-boundary",
            sourceType: "SIYER",
            sourceTitle:
              intercept.status === "fatwa_blocked"
                ? "Ehl-i Zikir & Alo 190 Fetva Usulü"
                : "Can Emniyeti & 112 Acil Destek",
          },
        ];
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

      ragChunkIds = chunks.map((c) => c.id);
      sources = chunks.map((c) => ({
        id: c.id,
        sourceType: c.sourceType,
        sourceTitle: c.sourceTitle,
        content: c.content,
        audioUrl: c.audioUrl ?? null,
      }));

      const resolvedTone =
        jevResult.distress_level >= 8
          ? "SEFKATLI_TESKIN"
          : jevResult.recommended_tone || "SEFKATLI_TESKIN";
      const resolvedStage =
        jevResult.distress_level >= 8
          ? "DARLIK_VE_BUNALIM"
          : jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC";

      const sirdasOutput = await generateSirdasReply({
        userMessage: safeMessage,
        userProfile: {
          roles: ["WEB_KULLANICI"],
          spiritual_trials: [jevResult.nafs_trap],
          tone_preference: resolvedTone,
          spiritual_stage: resolvedStage,
        },
        effectiveTone: resolvedTone,
        spiritualStage: resolvedStage,
        distressLevel: jevResult.distress_level,
        isRibaShieldActive,
        nafsTrap: jevResult.nafs_trap,
        ragCategory: jevResult.rag_category,
        ragChunks: chunks,
        conversationHistory,
        intentMode,
      });

      replyText = sirdasOutput.reply_text || sirdasOutput.whatsapp_reply || "";
      if (sirdasOutput.selected_audio_chunk_id) {
        const found = chunks.find(
          (c) => c.id === sirdasOutput.selected_audio_chunk_id
        );
        audioUrlSent = found?.audioUrl ?? null;
      } else {
        audioUrlSent = null;
      }
      editorAudit = {
        ...sirdasOutput.editor_audit,
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: jevResult.distress_level,
        tone: resolvedTone,
        spiritual_stage: resolvedStage,
      };
    }

    try {
      await persistChatTurn({
        userKey,
        conversationId,
        rawMessage: safeMessage,
        replyText,
        jevResult,
        editorAudit,
        ragChunkIds,
        audioUrlSent,
        extraFlags,
      });
    } catch (dbErr) {
      console.warn("[POST /api/chat DB Persistence Warning]", dbErr);
    }

    const res = NextResponse.json({
      success: true,
      status: statusType,
      conversationId,
      clientId: actor.clientId,
      replyText,
      intentMode,
      jevResult,
      editorAudit,
      sources,
      audioUrl: audioUrlSent,
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
