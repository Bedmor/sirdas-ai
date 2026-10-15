import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Source types supported by Sırdaş AI knowledge base
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

/**
 * Supabase client instance used primarily for pgvector hybrid search RPC calls
 * and direct storage operations.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Execute the multi-source balanced hybrid search RPC function
 * with comprehensive error handling and logging.
 */
export async function matchKnowledgeChunks(
  params: MatchKnowledgeChunksParams
): Promise<{ data: KnowledgeChunkMatch[] | null; error: Error | null }> {
  try {
    let embeddingPayload = params.query_embedding;
    if (typeof embeddingPayload === "string") {
      try {
        embeddingPayload = JSON.parse(embeddingPayload);
      } catch {
        // If not valid JSON, leave as is
      }
    }

    const { data, error } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: embeddingPayload,
      match_threshold: params.match_threshold ?? 0.5,
      match_count: params.match_count ?? 4,
      filter_category: params.filter_category ?? null,
      filter_nafs: params.filter_nafs ?? null,
      force_riba: params.force_riba ?? false,
    });

    if (error) {
      console.error("[Supabase RPC Error] match_knowledge_chunks:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as KnowledgeChunkMatch[], error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[Supabase RPC Exception] match_knowledge_chunks:", error);
    return { data: null, error };
  }
}

export default supabase;
