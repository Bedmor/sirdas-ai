import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { matchKnowledgeChunks } from "@/lib/db/supabase";
import {
  extractMeaningfulKeywords,
  searchLocalKnowledgeCorpus,
} from "@/lib/db/local-corpus";
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
  spiritual_stage?: string;
}

export interface GuardrailIntercept {
  status: "fatwa_blocked" | "crisis_redirected";
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

  // Yalnızca hiçbir dert veya soru içermeyen saf selamlama ve kısa hal-hatır mesajlarında RAG gerekmez
  const pureCasualGreetings =
    /^(selam(ün\s*aleyküm|un\s*aleykum)?|merhaba(lar)?|iyi\s*(günler|akşamlar)|günaydın|hayırlı\s*(sabahlar|akşamlar|günler|geceler)|naber|nasılsın|kimsin|sen\s*kimsin|hey|sa|as)(\s+(nasılsın|naber|iyi\s*misin))?[\s!.]*$/i;
  if (pureCasualGreetings.test(trimmed)) {
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
}): Promise<{ chunks: RagChunkContext[]; isRibaShieldActive: boolean }> {
  const { userMessage, queryEmbedding, jevResult } = params;
  const isRibaShieldActive = jevResult.is_debt_or_riba_related >= 0.6;
  let chunks: RagChunkContext[] = [];

  // Dynamic RAG: For casual greetings or light daily fatigue, do not inject RAG. Let Manevi Pusula listen like a true friend.
  if (!isSpiritualWisdomNeeded(userMessage, jevResult)) {
    return { chunks: [], isRibaShieldActive: false };
  }

  try {
    const rpcResponse = await matchKnowledgeChunks({
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 4,
      filter_category: jevResult.rag_category,
      filter_nafs: jevResult.nafs_trap,
      force_riba: isRibaShieldActive,
      user_message: userMessage,
    });

    if (
      !rpcResponse.error &&
      Array.isArray(rpcResponse.data) &&
      rpcResponse.data.length > 0
    ) {
      chunks = rpcResponse.data.map((r: SupabaseRagRow) => ({
        id: r.id,
        sourceType: r.source_type,
        sourceTitle: r.source_title,
        content: r.content,
        audioUrl: r.audio_url ?? null,
      }));
    }
  } catch {
    // Fallback to Prisma / local corpus search below
  }

  if (chunks.length === 0) {
    try {
      const keywords = extractMeaningfulKeywords(userMessage, 6);
      const conditions: Prisma.KnowledgeChunkWhereInput[] = [
        { tags: { has: jevResult.rag_category } },
        { nafsTraps: { has: jevResult.nafs_trap } },
      ];

      if (isRibaShieldActive) {
        conditions.unshift({ isRibaRelated: true });
      }

      if (keywords.length > 0) {
        conditions.push({
          OR: keywords.flatMap((kw: string) => [
            { content: { contains: kw, mode: "insensitive" } },
            { sourceTitle: { contains: kw, mode: "insensitive" } },
          ]),
        });
      }

      const dbChunks = await prisma.knowledgeChunk.findMany({
        where: { OR: conditions },
        take: 8,
        orderBy: isRibaShieldActive
          ? [{ isRibaRelated: "desc" }, { createdAt: "desc" }]
          : { createdAt: "desc" },
      });

      if (dbChunks.length > 0) {
        chunks = dbChunks.slice(0, 4).map((c) => ({
          id: c.id,
          sourceType: c.sourceType,
          sourceTitle: c.sourceTitle,
          content: c.content,
          audioUrl: c.audioUrl,
        }));
      }
    } catch {
      // Proceed to local corpus fallback
    }
  }

  // Ensure rich multi-source balance (QURAN, HADITH/SIYER/DUA, HALIS_AYDEMIR, and Bakara 275-279 when Riba Shield active)
  const localMatches = searchLocalKnowledgeCorpus({
    userMessage,
    filterCategory: jevResult.rag_category,
    filterNafs: jevResult.nafs_trap,
    forceRiba: isRibaShieldActive,
    matchCount: 4,
  });

  if (chunks.length === 0) {
    chunks = localMatches.map((m) => ({
      id: m.id,
      sourceType: m.sourceType,
      sourceTitle: m.sourceTitle,
      content: m.content,
      audioUrl: m.audioUrl,
    }));
  } else {
    // Guarantee Bakara 275-279 is first when Riba Shield is active
    if (isRibaShieldActive) {
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
