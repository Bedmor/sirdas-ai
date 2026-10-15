import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

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
 * 768-boyutlu deterministik bir test vektörü üretir (birim vektör normalize edilmiş)
 */
export function generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const vector: number[] = new Array(dimensions);
  let sumSq = 0;

  for (let i = 0; i < dimensions; i++) {
    const val = Math.sin(hash + i * 13.37);
    vector[i] = val;
    sumSq += val * val;
  }

  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => Number((v / norm).toFixed(6)));
}

/**
 * Google text-embedding-004 modeli ile 768-boyutlu embedding üretir.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return generateDeterministicEmbedding("empty_query", 768);
  }

  const client = getAIClient();
  if (!client) {
    return generateDeterministicEmbedding(cleanText, 768);
  }

  try {
    const res = await client.models.embedContent({
      model: "text-embedding-004",
      contents: cleanText
    });

    const values = res.embeddings?.[0]?.values;
    if (Array.isArray(values) && values.length > 0) {
      return values;
    }

    return generateDeterministicEmbedding(cleanText, 768);
  } catch (err) {
    console.warn("[Embeddings API Error - Falling back to deterministic embedding]", err);
    return generateDeterministicEmbedding(cleanText, 768);
  }
}
