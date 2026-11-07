import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isRemoteDbOffline } from "@/lib/db/local-corpus";
import { analyzeWithJev, JevAnalysisResult } from "@/lib/ai/jev-client";
import { generateEmbedding } from "@/lib/ai/embeddings";
import {
  generateSirdasReply,
  generateSirdasReplyStream,
  StreamReplyResult,
} from "@/lib/ai/gemini-client";
import {
  evaluateSpiritualGuardrails,
  filterUsedSourcesByReply,
  retrieveCelikKasaContext,
  persistConversationTurn,
  UnifiedEditorAudit,
} from "@/lib/ai/rag-pipeline";
import { sanitizeIncomingUserMessage } from "@/lib/ai/pii-anonymizer";
import {
  TRIAL_COOKIE_NAME,
  inMemoryUsedFingerprints,
  computeVisitorFingerprint,
  createSignedTrialToken,
  verifySignedTrialToken,
  isTrialDevMode,
  applyTrialCookiePolicy,
  buildTrialLimitReachedResponse,
} from "@/lib/ai/trial-rate-limit";

async function persistWebTrialTurn(params: {
  trialPhoneKey: string;
  fingerprint: string;
  isDev: boolean;
  rawMessage: string;
  replyText: string;
  jevResult: JevAnalysisResult;
  editorAudit: UnifiedEditorAudit | Record<string, unknown>;
  ragChunkIds?: string[];
  audioUrlSent: string | null;
  extraFlags?: {
    bypassed_to_violence_block?: boolean;
    bypassed_to_fatwa_block?: boolean;
    crisis_redirect?: boolean;
  };
}): Promise<void> {
  const {
    trialPhoneKey,
    fingerprint,
    isDev,
    rawMessage,
    replyText,
    jevResult,
    editorAudit,
    ragChunkIds = [],
    audioUrlSent,
    extraFlags,
  } = params;

  const createdUser = await prisma.user.upsert({
    where: { phoneNumber: trialPhoneKey },
    update: {
      lastActiveAt: new Date(),
      profileMetadata: {
        source: "web_trial",
        fingerprint,
        usedAt: new Date().toISOString(),
      },
    },
    create: {
      phoneNumber: trialPhoneKey,
      onboardingStep: 4,
      onboardingCompleted: true,
      profileMetadata: {
        source: "web_trial",
        fingerprint,
        usedAt: new Date().toISOString(),
      },
    },
  });

  const msgIdSuffix = isDev
    ? `_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    : "";

  await persistConversationTurn({
    userId: createdUser.id,
    waMessageId: `web_trial_msg_${fingerprint}${msgIdSuffix}`,
    userMessage: rawMessage,
    replyText,
    jevResult,
    editorAudit,
    ragChunkIds,
    audioSent: Boolean(audioUrlSent),
    audioUrlSent,
    extraFlags,
  });
}

function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const record = err as { code?: string; message?: string };
  return (
    record.code === "P2002" ||
    String(record.message || "").includes("Unique constraint")
  );
}

/**
 * GET /api/trial
 * Checks whether the visitor has already used their one-time web contemplation trial.
 */
export async function GET(req: NextRequest) {
  try {
    const isDev = isTrialDevMode(req);
    const cookieVal = req.cookies.get(TRIAL_COOKIE_NAME)?.value;
    const fp = computeVisitorFingerprint(req);
    const trialPhoneKey = `web_trial_${fp}`;

    const cookieUsed = verifySignedTrialToken(cookieVal);
    const memoryUsed = inMemoryUsedFingerprints.has(fp);

    const existingTrialUser = await prisma.user.findUnique({
      where: { phoneNumber: trialPhoneKey },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 2,
        },
      },
    });

    const userMsg = existingTrialUser?.messages.find((m) => m.role === "USER");
    const assistantMsg = existingTrialUser?.messages.find(
      (m) => m.role === "ASSISTANT"
    );

    const previousTrial =
      userMsg && assistantMsg
        ? {
            userMessage: userMsg.content,
            replyText: assistantMsg.content,
            jevResult: userMsg.jevMetadata,
            editorAudit: assistantMsg.editorAudit,
            audioUrl: assistantMsg.audioUrlSent,
          }
        : null;

    if (isDev) {
      const res = NextResponse.json({
        used: false,
        remaining: 999,
        isDev: true,
        previousTrial,
      });
      res.cookies.delete(TRIAL_COOKIE_NAME);
      return res;
    }

    if (cookieUsed || memoryUsed || existingTrialUser) {
      return NextResponse.json({
        used: true,
        remaining: 0,
        previousTrial,
      });
    }

    return NextResponse.json({
      used: false,
      remaining: 1,
      previousTrial: null,
    });
  } catch (error) {
    console.error("[GET /api/trial Error]", error);
    return NextResponse.json({ used: false, remaining: 1, previousTrial: null });
  }
}

/**
 * POST /api/trial
 * Processes a web trial contemplation message through System 1 (Jev) + Çelik Kasa RAG + System 2 (Gemini).
 */
export async function POST(req: NextRequest) {
  const isDev = isTrialDevMode(req);
  const cookieVal = req.cookies.get(TRIAL_COOKIE_NAME)?.value;
  const fp = computeVisitorFingerprint(req);
  const trialPhoneKey = `web_trial_${fp}`;

  const cookieUsed = verifySignedTrialToken(cookieVal);
  const memoryUsed = inMemoryUsedFingerprints.has(fp);

  if (!isDev && (cookieUsed || memoryUsed)) {
    return buildTrialLimitReachedResponse();
  }

  if (!isDev) {
    inMemoryUsedFingerprints.add(fp);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: trialPhoneKey },
    });

    if (!isDev && existingUser) {
      return buildTrialLimitReachedResponse();
    }

    const body = await req.json().catch(() => ({}));
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    if (!rawMessage || rawMessage.length < 5) {
      inMemoryUsedFingerprints.delete(fp);
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message:
            "Lütfen gönlünüzü meşgul eden durumu en az birkaç kelimeyle ifade edin.",
        },
        { status: 400 }
      );
    }

    if (rawMessage.length > 600) {
      inMemoryUsedFingerprints.delete(fp);
      return NextResponse.json(
        {
          error: "MESSAGE_TOO_LONG",
          message: "Deneme mesajınız en fazla 600 karakter olabilir.",
        },
        { status: 400 }
      );
    }

    // PII & Dolaylı Kimlik Süzgeci
    const anonymization = sanitizeIncomingUserMessage(rawMessage);
    const safeMessage = anonymization.sanitizedText;

    const signedToken = createSignedTrialToken(fp);
    const acceptHeader = req.headers.get("accept") || "";
    const userAgent = req.headers.get("user-agent") || "";
    const isVerifyBot = userAgent.includes("SirdasVerifyBot");

    const isSseRequested =
      acceptHeader.includes("text/event-stream") ||
      body.stream === true ||
      (!isVerifyBot &&
        body.stream !== false &&
        !acceptHeader.includes("application/json"));

    if (isSseRequested) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let accumulatedReply = "";
          let editorAudit: UnifiedEditorAudit | Record<string, unknown> | null = null;
          let audioUrlSent: string | null = null;
          let statusType: "processed" | "fatwa_blocked" | "crisis_redirected" =
            "processed";
          let jevResult: JevAnalysisResult | null = null;
          let ragChunkIds: string[] = [];
          let extraFlags: GuardrailFlags | undefined;

          try {
            jevResult = await analyzeWithJev({
              userMessage: safeMessage,
              userContextSnippet: JSON.stringify({ source: "web_landing_trial" }),
            });

            const intercept = evaluateSpiritualGuardrails(safeMessage, jevResult);

            if (intercept) {
              statusType = intercept.status;
              editorAudit = intercept.editorAudit;
              extraFlags = intercept.extraFlags;
              const tokens = intercept.replyText.match(/\S+\s*/g) || [
                intercept.replyText,
              ];
              for (const token of tokens) {
                accumulatedReply += token;
                const frame = `event: token\ndata: ${JSON.stringify({ token, text: accumulatedReply })}\n\n`;
                controller.enqueue(encoder.encode(frame));
                if (process.env.NODE_ENV !== "test" && !process.env.CI) {
                  await new Promise((r) => setTimeout(r, 15));
                }
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
                });

              const resolvedTone =
                jevResult.session_mood === "OFKELI_VE_GERGIN"
                  ? "SAKINLESTIRICI_VE_VAKUR"
                  : jevResult.session_mood === "HUZUNLU_VE_KIRGIN" ||
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
                  roles: ["MISAFIR_KULLANICI"],
                  spiritual_trials: [jevResult.nafs_trap],
                  tone_preference: resolvedTone,
                  spiritual_stage: resolvedStage,
                },
                effectiveTone: resolvedTone,
                sessionMood: jevResult.session_mood,
                spiritualStage: resolvedStage,
                distressLevel: jevResult.distress_level,
                isRibaShieldActive,
                nafsTrap: jevResult.nafs_trap,
                ragCategory: jevResult.rag_category,
                ragChunks: chunks,
              });

              let hasStrippedGreeting = false;
              let leadingBuffer = "";
              let streamFinalResult: StreamReplyResult | null = null;

              while (true) {
                const nextChunk = await streamGenerator.next();
                if (nextChunk.done) {
                  streamFinalResult = nextChunk.value;
                  break;
                }
                const token = nextChunk.value;
                let textToEmit = token;

                if (!hasStrippedGreeting) {
                  leadingBuffer += token;
                  const trimmed = leadingBuffer.trimStart();
                  const isPotentialGreeting =
                    /^(v|ve|a|al|ale|aley|aleyk|s|se|sel|sela|selam)/i.test(
                      trimmed
                    );

                  if (isPotentialGreeting) {
                    const greetingMatch = trimmed.match(
                      /^(ve\s+)?(aleyk[uü]m\s+selam|selam[uü]n\s+aleyk[uü]m)[.,!\s]*/i
                    );
                    if (greetingMatch) {
                      textToEmit = trimmed.slice(greetingMatch[0].length);
                      hasStrippedGreeting = true;
                      leadingBuffer = "";
                      if (!textToEmit) continue;
                    } else if (trimmed.length > 20) {
                      textToEmit = leadingBuffer;
                      hasStrippedGreeting = true;
                      leadingBuffer = "";
                    } else {
                      continue;
                    }
                  } else {
                    textToEmit = leadingBuffer;
                    hasStrippedGreeting = true;
                    leadingBuffer = "";
                  }
                }

                accumulatedReply += textToEmit;
                const frame = `event: token\ndata: ${JSON.stringify({ token: textToEmit, text: accumulatedReply })}\n\n`;
                controller.enqueue(encoder.encode(frame));
              }

              if (leadingBuffer) {
                accumulatedReply += leadingBuffer;
                const frame = `event: token\ndata: ${JSON.stringify({ token: leadingBuffer, text: accumulatedReply })}\n\n`;
                controller.enqueue(encoder.encode(frame));
              }

              const usedChunks = filterUsedSourcesByReply(
                chunks,
                accumulatedReply
              );
              ragChunkIds = usedChunks.map((c) => c.id);

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
                siyer_example_used: isRibaShieldActive
                  ? "Efendimiz'in borç ve kederden sığınma duası"
                  : "Taif dönüşü Efendimiz'in (s.a.v.) tevekkülü",
                riba_warning_included: isRibaShieldActive,
                nafs_trap: jevResult.nafs_trap,
                rag_category: jevResult.rag_category,
                distress_level: jevResult.distress_level,
                tone: resolvedTone,
                spiritual_stage: resolvedStage,
              };
            }

            try {
              await persistWebTrialTurn({
                trialPhoneKey,
                fingerprint: fp,
                isDev,
                rawMessage: safeMessage,
                replyText: accumulatedReply,
                jevResult,
                editorAudit: editorAudit || {},
                ragChunkIds,
                audioUrlSent,
                extraFlags,
              });
            } catch (dbErr) {
              console.warn("[POST /api/trial DB Persistence Warning]", dbErr);
            }

            const donePayload = JSON.stringify({
              success: true,
              status: statusType,
              remaining: isDev ? 999 : 0,
              used: !isDev,
              isDev,
              trial: {
                userMessage: safeMessage,
                replyText: accumulatedReply,
                jevResult,
                editorAudit,
                audioUrl: audioUrlSent,
              },
            });
            controller.enqueue(
              encoder.encode(`event: done\ndata: ${donePayload}\n\n`)
            );
            controller.close();
          } catch (streamErr) {
            console.error("[POST /api/trial Stream Error]", streamErr);
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

      applyTrialCookiePolicy(response, isDev, signedToken);
      return response;
    }

    // --- NON-STREAMING JSON PATH ---
    const jevResult = await analyzeWithJev({
      userMessage: safeMessage,
      userContextSnippet: JSON.stringify({ source: "web_landing_trial" }),
    });

    const intercept = evaluateSpiritualGuardrails(safeMessage, jevResult);

    let replyText = "";
    let editorAudit: UnifiedEditorAudit | Record<string, unknown>;
    let audioUrlSent: string | null = null;
    let statusType: "processed" | "fatwa_blocked" | "crisis_redirected" =
      "processed";
    let ragChunkIds: string[] = [];
    let extraFlags: GuardrailFlags | undefined;

    if (intercept) {
      statusType = intercept.status;
      replyText = intercept.replyText;
      editorAudit = intercept.editorAudit;
      extraFlags = intercept.extraFlags;
    } else {
      const queryEmbedding = isRemoteDbOffline()
        ? new Array(768).fill(0)
        : await generateEmbedding(safeMessage);
      const { chunks, isRibaShieldActive } = await retrieveCelikKasaContext({
        userMessage: safeMessage,
        queryEmbedding,
        jevResult,
      });

      const resolvedTone =
        jevResult.session_mood === "OFKELI_VE_GERGIN"
          ? "SAKINLESTIRICI_VE_VAKUR"
          : jevResult.session_mood === "HUZUNLU_VE_KIRGIN" ||
              jevResult.distress_level >= 8
            ? "SEFKATLI_TESKIN"
            : jevResult.recommended_tone || "SEFKATLI_TESKIN";
      const resolvedStage =
        jevResult.distress_level >= 8
          ? "DARLIK_VE_BUNALIM"
          : jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC";

      const sirdasReply = await generateSirdasReply({
        userMessage: safeMessage,
        userProfile: {
          roles: ["MISAFIR_KULLANICI"],
          spiritual_trials: [jevResult.nafs_trap],
          tone_preference: resolvedTone,
          spiritual_stage: resolvedStage,
        },
        effectiveTone: resolvedTone,
        sessionMood: jevResult.session_mood,
        spiritualStage: resolvedStage,
        distressLevel: jevResult.distress_level,
        isRibaShieldActive,
        nafsTrap: jevResult.nafs_trap,
        ragCategory: jevResult.rag_category,
        ragChunks: chunks,
      });

      replyText = sirdasReply.reply_text || sirdasReply.whatsapp_reply || "";
      editorAudit = sirdasReply.editor_audit;

      const usedChunks = filterUsedSourcesByReply(chunks, replyText);
      ragChunkIds = usedChunks.map((c) => c.id);

      if (sirdasReply.selected_audio_chunk_id) {
        const matched = usedChunks.find(
          (c) => c.id === sirdasReply.selected_audio_chunk_id
        );
        if (matched?.audioUrl) {
          audioUrlSent = matched.audioUrl;
        }
      }
    }

    try {
      await persistWebTrialTurn({
        trialPhoneKey,
        fingerprint: fp,
        isDev,
        rawMessage: safeMessage,
        replyText,
        jevResult,
        editorAudit,
        ragChunkIds,
        audioUrlSent,
        extraFlags,
      });
    } catch (dbErr) {
      if (!isDev && isUniqueConstraintError(dbErr)) {
        return buildTrialLimitReachedResponse();
      }
      console.warn("[POST /api/trial DB Persistence Warning]", dbErr);
    }

    const response = NextResponse.json({
      success: true,
      status: statusType,
      used: !isDev,
      remaining: isDev ? 999 : 0,
      isDev,
      trial: {
        userMessage: safeMessage,
        replyText,
        jevResult,
        editorAudit,
        audioUrl: audioUrlSent,
      },
    });

    applyTrialCookiePolicy(response, isDev, signedToken);
    return response;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return buildTrialLimitReachedResponse();
    }
    console.error("[POST /api/trial Error]", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          "Şu anda tefekkür odasında yoğunluk yaşanıyor, lütfen biraz sonra tekrar deneyin.",
      },
      { status: 500 }
    );
  }
}

type GuardrailFlags = {
  bypassed_to_violence_block?: boolean;
  bypassed_to_fatwa_block?: boolean;
  crisis_redirect?: boolean;
};
