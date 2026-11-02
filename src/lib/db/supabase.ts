import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  isRemoteDbOffline,
  markRemoteDbOffline,
  searchLocalKnowledgeCorpus,
} from "./local-corpus";

/**
 * Source types supported by Manevi Pusula knowledge base
 */
export type SourceType = "QURAN" | "HADITH" | "DUA" | "HALIS_AYDEMIR" | "SIYER";

/**
 * Parameters for the multi-source balanced hybrid search PostgreSQL RPC function
 * defined in prisma/sql/02_hybrid_search_rpc.sql
 */
export interface MatchKnowledgeChunksParams {
  query_embedding: number[] | string;
  match_threshold?: number;
  match_count?: number;
  filter_category?: string | null;
  filter_nafs?: string | null;
  force_riba?: boolean;
  user_message?: string;
}

/**
 * Row structure returned by the match_knowledge_chunks RPC function
 */
export interface KnowledgeChunkMatch {
  id: string;
  source_type: SourceType;
  source_title: string;
  content: string;
  tags: string[];
  nafs_traps: string[];
  is_riba_related: boolean;
  youtube_id: string | null;
  start_sec: number | null;
  end_sec: number | null;
  audio_url: string | null;
  similarity: number;
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "placeholder-key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function isStubSupabaseUrl(url: string): boolean {
  return (
    !url ||
    url.includes("test-project") ||
    url.includes("placeholder-project")
  );
}

function buildLocalFallbackMatches(
  params: MatchKnowledgeChunksParams
): KnowledgeChunkMatch[] {
  const results = searchLocalKnowledgeCorpus({
    userMessage: params.user_message,
    filterCategory: params.filter_category,
    filterNafs: params.filter_nafs,
    forceRiba: params.force_riba,
    matchCount: params.match_count ?? 4,
  });

  return results.map((r) => ({
    id: r.id,
    source_type: r.sourceType,
    source_title: r.sourceTitle,
    content: r.content,
    tags: r.tags,
    nafs_traps: r.nafsTraps,
    is_riba_related: r.isRibaRelated,
    youtube_id: r.youtubeId,
    start_sec: r.startSec,
    end_sec: r.endSec,
    audio_url: r.audioUrl,
    similarity: r.similarity,
  }));
}

/**
 * Execute the multi-source balanced hybrid search RPC function
 * with circuit-breaker protection and local corpus hybrid fallback.
 */
export async function matchKnowledgeChunks(
  params: MatchKnowledgeChunksParams
): Promise<{ data: KnowledgeChunkMatch[] | null; error: Error | null }> {
  const currentUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    supabaseUrl;

  if (isStubSupabaseUrl(currentUrl)) {
    return {
      data: null,
      error: new Error("Offline/stub Supabase URL configured"),
    };
  }

  if (isRemoteDbOffline()) {
    return {
      data: buildLocalFallbackMatches(params),
      error: null,
    };
  }

  try {
    let embeddingPayload = params.query_embedding;
    if (typeof embeddingPayload === "string") {
      try {
        embeddingPayload = JSON.parse(embeddingPayload);
      } catch {
        // Leave as is if not valid JSON
      }
    }

    const { data, error } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: embeddingPayload,
      match_threshold: params.match_threshold ?? 0.3,
      match_count: params.match_count ?? 4,
      filter_category: params.filter_category ?? null,
      filter_nafs: params.filter_nafs ?? null,
      force_riba: params.force_riba ?? false,
    });

    if (error) {
      const msg = String(error.message || "");
      if (
        msg.includes("fetch failed") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("timeout")
      ) {
        markRemoteDbOffline(60_000);
        return {
          data: buildLocalFallbackMatches(params),
          error: null,
        };
      }
      return { data: null, error: new Error(error.message) };
    }

    if (Array.isArray(data) && data.length > 0) {
      return { data: data as KnowledgeChunkMatch[], error: null };
    }

    return {
      data: buildLocalFallbackMatches(params),
      error: null,
    };
  } catch {
    markRemoteDbOffline(60_000);
    return {
      data: buildLocalFallbackMatches(params),
      error: null,
    };
  }
}

export default supabase;
