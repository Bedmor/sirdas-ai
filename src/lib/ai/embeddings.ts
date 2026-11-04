import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
let embeddingApiOfflineUntil = 0;

const MAX_CACHE_ENTRIES = 250;
const embeddingCache = new Map<string, number[]>();

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock_gemini_key_for_testing_and_verification") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * L2-normalizes a vector to unit length (||v|| = 1.0).
 * Mandatory when using Matryoshka truncated dimensions (768d) on gemini-embedding-001.
 */
export function normalizeL2(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * 768-boyutlu deterministik bir test vektörü üretir (birim vektör normalize edilmiş)
 */
export function generateDeterministicEmbedding(
  text: string,
  dimensions = 768
): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const vector: number[] = new Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    vector[i] = Math.sin(hash + i * 13.37);
  }

  return normalizeL2(vector);
}

function setCachedEmbedding(key: string, vec: number[]): void {
  if (embeddingCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = embeddingCache.keys().next().value;
    if (oldestKey !== undefined) {
      embeddingCache.delete(oldestKey);
    }
  }
  embeddingCache.set(key, vec);
}

/**
 * Google gemini-embedding-001 modeli ile L2-normalize edilmiş 768-boyutlu embedding üretir.
 * Bellek içi LRU önbellek ile mükerrer sorgularda 0ms gecikme ve 0 API maliyeti sağlar.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return generateDeterministicEmbedding("empty_query", 768);
  }

  const cacheKey = cleanText.toLowerCase();
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const client = getAIClient();
  if (!client || Date.now() < embeddingApiOfflineUntil) {
    return generateDeterministicEmbedding(cleanText, 768);
  }

  try {
    const res = await client.models.embedContent({
      model: "gemini-embedding-001",
      contents: cleanText,
      config: {
        outputDimensionality: 768,
        abortSignal: AbortSignal.timeout(6000),
      },
    });

    const values = res.embeddings?.[0]?.values;
    if (Array.isArray(values) && values.length === 768) {
      const normalized = normalizeL2(values);
      setCachedEmbedding(cacheKey, normalized);
      return normalized;
    }

    return generateDeterministicEmbedding(cleanText, 768);
  } catch (err) {
    embeddingApiOfflineUntil = Date.now() + 30_000;
    console.warn(
      "[Embeddings API Warning - Falling back to deterministic embedding]",
      err instanceof Error ? err.message : err
    );
    return generateDeterministicEmbedding(cleanText, 768);
  }
}
