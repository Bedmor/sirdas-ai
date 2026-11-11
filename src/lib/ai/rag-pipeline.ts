import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { matchKnowledgeChunks } from "@/lib/db/supabase";
import {
  extractMeaningfulKeywords,
  MIN_LOCAL_RAG_SCORE,
  scoreChunkRelevance,
  searchLocalKnowledgeCorpus,
  LocalSourceType,
} from "@/lib/db/local-corpus";
import { ChatIntentMode } from "./intent-router";
import { checkAdversarialGuardrails } from "./adversarial-guardrails";
import { filterUsedSourcesByReply, isSourceUsedInReply } from "./source-citation-filter";

export { filterUsedSourcesByReply, isSourceUsedInReply };
import {
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  checkViolenceAndAbuse,
  checkCrisisAndSuicide,
  JevAnalysisResult,
  SpiritualStage,
} from "./jev-client";
import { RagChunkContext } from "./gemini-client";

export interface EnrichedJevMetadata extends JevAnalysisResult {
  noul: {
    is_fatwa: number;
    is_riba: number;
    needs_audio: number;
  };
  choice: {
    nafs_trap: string;
    rag_category: string;
    recommended_tone: string;
    spiritual_stage?: SpiritualStage;
  };
  score: {
    distress_level: number;
  };
  bypassed_to_violence_block?: boolean;
  bypassed_to_fatwa_block?: boolean;
  crisis_redirect?: boolean;
}

export interface UnifiedEditorAudit {
  murakabe_applied: boolean;
  ilahi_riza_checked: boolean;
  tevekkul_and_talak_hope_included: boolean;
  nafs_and_vesvese_addressed: string;
  siyer_example_used: string;
  riba_warning_included: boolean;
  nafs_trap?: string;
  rag_category?: string;
  distress_level?: number;
  tone?: string;
  session_mood?: string;
  spiritual_stage?: string;
  intent_mode?: string;
}

export interface GuardrailIntercept {
  status: "fatwa_blocked" | "crisis_redirected" | "processed";
  ruleId?: string;
  replyText: string;
  editorAudit: UnifiedEditorAudit;
  extraFlags: {
    bypassed_to_violence_block?: boolean;
    bypassed_to_fatwa_block?: boolean;
    crisis_redirect?: boolean;
  };
}

export function buildEnrichedJevMetadata(
  jevResult: JevAnalysisResult,
  extraFlags?: {
    bypassed_to_violence_block?: boolean;
    bypassed_to_fatwa_block?: boolean;
    crisis_redirect?: boolean;
  }
): EnrichedJevMetadata {
  return {
    ...jevResult,
    noul: {
      is_fatwa: jevResult.is_fiqh_fatwa_request,
      is_riba: jevResult.is_debt_or_riba_related,
      needs_audio: jevResult.needs_audio_snippet,
    },
    choice: {
      nafs_trap: jevResult.nafs_trap,
      rag_category: jevResult.rag_category,
      recommended_tone: jevResult.recommended_tone || "SEFKATLI_TESKIN",
      spiritual_stage: jevResult.spiritual_stage,
    },
    score: {
      distress_level: jevResult.distress_level,
    },
    ...extraFlags,
  };
}

/**
 * Evaluates all 3 spiritual & safety guardrails in strict priority order:
 * 1. Violence & Domestic Abuse (112 / ALO 183 / KADES)
 * 2. Existential Crisis & Suicide (112 Emergency)
 * 3. Fiqh / Fatwa Boundary (Alo 190 Diyanet)
 */
export function evaluateSpiritualGuardrails(
  userMessage: string,
  jevResult: JevAnalysisResult
): GuardrailIntercept | null {
  // 0. Çelik Kasa Adversarial Kalkanı (18 Zorlayıcı Senaryo Ön Süzgeci)
  const adv = checkAdversarialGuardrails(userMessage);
  if (adv) {
    const isCrisis = adv.status === "crisis_redirected";
    return {
      status: adv.status,
      ruleId: adv.ruleId,
      replyText: adv.replyText,
      extraFlags: {
        bypassed_to_violence_block: adv.ruleId === "VIOLENCE_HARM",
        crisis_redirect: isCrisis,
        bypassed_to_fatwa_block: adv.status === "fatwa_blocked",
      },
      editorAudit: {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: adv.auditTag,
        siyer_example_used: adv.ruleId,
        riba_warning_included: adv.ruleId === "RIBA_APPROVAL_GUARD",
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: isCrisis ? 10 : jevResult.distress_level,
        tone: isCrisis ? "SEFKATLI_TESKIN" : "NET_VE_MUALLIM",
        spiritual_stage: isCrisis
          ? "DARLIK_VE_BUNALIM"
          : jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC",
        intent_mode: adv.intentMode,
      },
    };
  }

  const violenceCheck = checkViolenceAndAbuse(userMessage);
  if (violenceCheck) {
    return {
      status: "crisis_redirected",
      replyText: violenceCheck.message,
      extraFlags: { bypassed_to_violence_block: true },
      editorAudit: {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: "SIDDET_VE_DARP_ENGELI",
        siyer_example_used: "112 ve ALO 183 Şiddet Önleme Yönlendirmesi",
        riba_warning_included: false,
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: 10,
        tone: "SEFKATLI_TESKIN",
        spiritual_stage: "DARLIK_VE_BUNALIM",
      },
    };
  }

  const crisisCheck = checkCrisisAndSuicide(userMessage);
  const isExtremeSuicideSignal =
    crisisCheck !== null ||
    (jevResult.distress_level >= 10 &&
      (jevResult.is_extreme_crisis ||
        /intihar|ölmek|canıma kıy|yaşamak istem|kendimi as|hayatıma son/i.test(userMessage)));

  if (isExtremeSuicideSignal) {
    return {
      status: "crisis_redirected",
      replyText: crisisCheck ? crisisCheck.message : CRISIS_EMERGENCY_MESSAGE,
      extraFlags: { crisis_redirect: true },
      editorAudit: {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: "ACIL_KRIZ_KORUMASI",
        siyer_example_used: "Can Emaneti ve 112 Acil Yardım",
        riba_warning_included: false,
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: 10,
        tone: "SEFKATLI_TESKIN",
        spiritual_stage: "DARLIK_VE_BUNALIM",
      },
    };
  }

  if (jevResult.is_fiqh_fatwa_request >= 0.75) {
    return {
      status: "fatwa_blocked",
      replyText: FATWA_REJECTION_MESSAGE,
      extraFlags: { bypassed_to_fatwa_block: true },
      editorAudit: {
        murakabe_applied: true,
        ilahi_riza_checked: true,
        tevekkul_and_talak_hope_included: true,
        nafs_and_vesvese_addressed: "FIKIH_FETVA_SINIRI",
        siyer_example_used: "Ehl-i Zikir ve Alo 190 Yönlendirmesi",
        riba_warning_included: false,
        nafs_trap: jevResult.nafs_trap,
        rag_category: jevResult.rag_category,
        distress_level: jevResult.distress_level,
        tone: "NET_VE_MUALLIM",
        spiritual_stage: jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC",
      },
    };
  }

  return null;
}

interface SupabaseRagRow {
  id: string;
  source_type: string;
  source_title: string;
  content: string;
  audio_url?: string | null;
}

/**
 * Need-Based Dynamic RAG Gate:
 * Determines if the query requires retrieving & quoting theological wisdom (Ayet/Hadis/Siyer)
 * or if it is a casual greeting, light venting, or routine check-in where Manevi Pusula
 * should simply listen with empathy and warm friendship without throwing citations.
 */
export function isSpiritualWisdomNeeded(
  userMessage: string,
  _jevResult?: JevAnalysisResult
): boolean {
  const trimmed = userMessage.trim().toLowerCase();

  // Yalnızca hiçbir dert veya soru içermeyen saf selamlama, seslenme ve kısa hal-hatır mesajlarında RAG gerekmez
  const pureCasualGreetings =
    /^(selam(ün\s*aleyküm|un\s*aleykum)?|merhaba(lar)?|iyi\s*(günler|akşamlar)|günaydın|hayırlı\s*(sabahlar|akşamlar|günler|geceler)|naber|nasılsın|kimsin|sen\s*kimsin|hey|sa|as|alo+|alooo+|or(a|da)mısın|orada\s*mısın|ses\s*ver|duyuyor\s*musun|bakar\s*mısın)(\s+(nasılsın|naber|iyi\s*misin))?[\s!.]*$/i;
  if (pureCasualGreetings.test(trimmed)) {
    return false;
  }

  // Kısa diyalog akışları, geçişler ve şaşkınlık/tepki mesajlarında (ör: "ee sonra", "knk ne diyon", "peki sonra", "ne diyon") RAG gerekmez
  const casualFollowups =
    /^(ee\s*sonra|sonra\s*ne\s*oldu|peki\s*sonra|ne\s*diyon|knk(\s*ne\s*diyon)?|kanka(\s*ne\s*diyon)?|yani|nasıl\s*yani|devam\s*et|anladım|peki|tamam)[\s?!.]*$/i;
  if (casualFollowups.test(trimmed)) {
    return false;
  }

  // Kullanıcı herhangi bir halini, derdini, duygu veya sorusunu paylaşıyorsa,
  // Kur'an-ı Kerim ve Sünnet hikmeti (RAG) daima devreye girmelidir.
  return true;
}

/**
 * Canonical Çelik Kasa hybrid RAG retrieval pipeline:
 * 1. Balanced multi-source pgvector RPC (`matchKnowledgeChunks` with threshold 0.30)
 * 2. Stop-word filtered + category/nafsTrap-aware Prisma fallback
 * 3. Guaranteed multi-source local corpus fallback (QURAN + HADITH/SIYER/DUA + Bakara 275-279 Riba Shield)
 */
export async function retrieveCelikKasaContext(params: {
  userMessage: string;
  queryEmbedding: number[];
  jevResult: JevAnalysisResult;
  intentMode?: ChatIntentMode;
}): Promise<{ chunks: RagChunkContext[]; isRibaShieldActive: boolean }> {
  const { userMessage, queryEmbedding, jevResult, intentMode } = params;
  const isRibaShieldActive = jevResult.is_debt_or_riba_related >= 0.6;
  let chunks: RagChunkContext[] = [];

  // Dynamic RAG: For casual greetings or light daily fatigue, do not inject RAG. Let Manevi Pusula listen like a true friend.
  if (!isSpiritualWisdomNeeded(userMessage, jevResult)) {
    return { chunks: [], isRibaShieldActive: false };
  }

  // Serbest RAG: İlim ve Siyer modunda sadece Siyer/İlim arşivini süz;
  // Manevi dertleşme modunda ise kategoriyi zorlamayarak saf vektör benzerliğinin
  // kullanıcının gerçek hissiyle en çok örtüşen ayet ve hadisleri getirmesini sağla.
  const effectiveCategory =
    intentMode === "ILIM_VE_SIYER"
      ? "SIYER_ORNEKLERI"
      : undefined;

  const MIN_VECTOR_THRESHOLD = 0.52;
  const hasValidEmbedding =
    Array.isArray(queryEmbedding) &&
    queryEmbedding.length > 0 &&
    queryEmbedding.some((v) => typeof v === "number" && v !== 0);

  if (hasValidEmbedding) {
    try {
      const rpcResponse = await matchKnowledgeChunks({
        query_embedding: queryEmbedding,
        match_threshold: MIN_VECTOR_THRESHOLD,
        match_count: 4,
        filter_category: effectiveCategory,
        filter_nafs: undefined,
        force_riba: isRibaShieldActive,
        user_message: userMessage,
      });

      if (
        !rpcResponse.error &&
        Array.isArray(rpcResponse.data) &&
        rpcResponse.data.length > 0
      ) {
        chunks = rpcResponse.data.map(
          (
            r: SupabaseRagRow & { similarity?: number; is_riba_related?: boolean }
          ) => ({
            id: r.id,
            sourceType: r.source_type,
            sourceTitle: r.source_title,
            content: r.content,
            audioUrl: r.audio_url ?? null,
          })
        );
      }
    } catch {
      // Fallback to Prisma / local corpus search below
    }
  }

  if (chunks.length === 0) {
    const keywords = extractMeaningfulKeywords(userMessage, 6);
    if (keywords.length > 0 || isRibaShieldActive) {
      try {
        const conditions: Prisma.KnowledgeChunkWhereInput[] = [];

        if (isRibaShieldActive) {
          conditions.push({ isRibaRelated: true });
        }

        if (keywords.length > 0) {
          conditions.push({
            OR: keywords.flatMap((kw: string) => [
              { content: { contains: kw, mode: "insensitive" } },
              { sourceTitle: { contains: kw, mode: "insensitive" } },
            ]),
          });
        }

        if (conditions.length > 0) {
          const dbChunks = await prisma.knowledgeChunk.findMany({
            where:
              effectiveCategory && !isRibaShieldActive
                ? {
                    AND: [
                      { tags: { has: effectiveCategory } },
                      { OR: conditions },
                    ],
                  }
                : { OR: conditions },
            take: 8,
            orderBy: isRibaShieldActive
              ? [{ isRibaRelated: "desc" }, { createdAt: "desc" }]
              : { createdAt: "desc" },
          });

          if (dbChunks.length > 0) {
            const scoredDbChunks = dbChunks
              .map((c) => {
                const relevance = scoreChunkRelevance(
                  {
                    id: c.id,
                    sourceType: c.sourceType as LocalSourceType,
                    sourceTitle: c.sourceTitle,
                    content: c.content,
                    tags: c.tags,
                    nafsTraps: c.nafsTraps,
                    isRibaRelated: c.isRibaRelated,
                    youtubeId: c.youtubeId,
                    startSec: c.startSec,
                    endSec: c.endSec,
                    audioUrl: c.audioUrl,
                    createdAt: c.createdAt,
                  },
                  {
                    userMessage,
                    filterCategory: effectiveCategory ?? null,
                    forceRiba: isRibaShieldActive,
                    intentMode,
                  },
                  keywords
                );
                return { chunk: c, relevance };
              })
              .filter(
                (item) =>
                  (isRibaShieldActive && item.chunk.isRibaRelated) ||
                  item.relevance >= MIN_LOCAL_RAG_SCORE
              )
              .sort((a, b) => b.relevance - a.relevance);

            chunks = scoredDbChunks.slice(0, 4).map(({ chunk: c }) => ({
              id: c.id,
              sourceType: c.sourceType,
              sourceTitle: c.sourceTitle,
              content: c.content,
              audioUrl: c.audioUrl,
            }));
          }
        }
      } catch {
        // Proceed to local corpus fallback
      }
    }
  }

  // Yalnızca gerçek alaka eşiği (>= MIN_LOCAL_RAG_SCORE) sağlandığında yerel kasadan eşleşme getir;
  // eşik altındaysa zorla rastgele ayet/hadis çekilmez (chunks = []).
  if (chunks.length === 0) {
    const localMatches = searchLocalKnowledgeCorpus({
      userMessage,
      filterCategory: effectiveCategory ?? null,
      filterNafs: null,
      forceRiba: isRibaShieldActive,
      matchCount: 4,
      minSimilarity: MIN_LOCAL_RAG_SCORE,
      intentMode,
    });
    chunks = localMatches.map((m) => ({
      id: m.id,
      sourceType: m.sourceType,
      sourceTitle: m.sourceTitle,
      content: m.content,
      audioUrl: m.audioUrl,
    }));
  } else if (chunks.length > 0) {
    // If ILIM_VE_SIYER mode and no Siyer chunk was returned by pgvector RPC, guarantee one via fallback
    if (intentMode === "ILIM_VE_SIYER" && !chunks.some((c) => c.sourceType === "SIYER")) {
      const localMatches = searchLocalKnowledgeCorpus({
        userMessage,
        filterCategory: "SIYER_ORNEKLERI",
        matchCount: 1,
        intentMode,
      });
      const siyerMatch = localMatches.find((m) => m.sourceType === "SIYER");
      if (siyerMatch && !chunks.some((c) => c.id === siyerMatch.id)) {
        chunks.unshift({
          id: siyerMatch.id,
          sourceType: siyerMatch.sourceType,
          sourceTitle: siyerMatch.sourceTitle,
          content: siyerMatch.content,
          audioUrl: siyerMatch.audioUrl,
        });
      }
    }

    // Guarantee Bakara 275-279 is first when Riba Shield is active and not already present
    if (isRibaShieldActive && !chunks.some((c) => c.sourceTitle.includes("275") || c.content.includes("275"))) {
      const localMatches = searchLocalKnowledgeCorpus({
        userMessage,
        forceRiba: true,
        matchCount: 1,
      });
      const bakaraMatch = localMatches.find(
        (m) =>
          m.isRibaRelated &&
          (m.tags.includes("BAKARA_275_279") || m.sourceTitle.includes("275"))
      );
      if (bakaraMatch && !chunks.some((c) => c.id === bakaraMatch.id)) {
        chunks.unshift({
          id: bakaraMatch.id,
          sourceType: bakaraMatch.sourceType,
          sourceTitle: bakaraMatch.sourceTitle,
          content: bakaraMatch.content,
          audioUrl: bakaraMatch.audioUrl,
        });
      }
    }

    if (chunks.length > 5) {
      chunks = chunks.slice(0, 5);
    }
  }

  return { chunks, isRibaShieldActive };
}

export async function persistConversationTurn(params: {
  userId: string;
  waMessageId: string;
  userMessage: string;
  replyText: string;
  jevResult: JevAnalysisResult;
  editorAudit: UnifiedEditorAudit | Record<string, unknown>;
  ragChunkIds?: string[];
  audioSent?: boolean;
  audioUrlSent?: string | null;
  extraFlags?: {
    bypassed_to_violence_block?: boolean;
    bypassed_to_fatwa_block?: boolean;
    crisis_redirect?: boolean;
  };
  updatedUserProfile?: Record<string, unknown>;
}): Promise<void> {
  const {
    userId,
    waMessageId,
    userMessage,
    replyText,
    jevResult,
    editorAudit,
    ragChunkIds = [],
    audioSent = false,
    audioUrlSent = null,
    extraFlags,
    updatedUserProfile,
  } = params;

  const userJevMeta = buildEnrichedJevMetadata(jevResult) as unknown as Prisma.InputJsonValue;
  const assistantJevMeta = buildEnrichedJevMetadata(
    jevResult,
    extraFlags
  ) as unknown as Prisma.InputJsonValue;
  const auditJson = editorAudit as unknown as Prisma.InputJsonValue;

  if (updatedUserProfile) {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          waMessageId,
          userId,
          role: "USER",
          content: userMessage,
          jevMetadata: userJevMeta,
        },
      }),
      prisma.message.create({
        data: {
          userId,
          role: "ASSISTANT",
          content: replyText,
          jevMetadata: assistantJevMeta,
          ragChunkIds,
          editorAudit: auditJson,
          audioSent,
          audioUrlSent,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          profileMetadata: updatedUserProfile as Prisma.InputJsonValue,
          lastActiveAt: new Date(),
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          waMessageId,
          userId,
          role: "USER",
          content: userMessage,
          jevMetadata: userJevMeta,
        },
      }),
      prisma.message.create({
        data: {
          userId,
          role: "ASSISTANT",
          content: replyText,
          jevMetadata: assistantJevMeta,
          ragChunkIds,
          editorAudit: auditJson,
          audioSent,
          audioUrlSent,
        },
      }),
    ]);
  }
}
