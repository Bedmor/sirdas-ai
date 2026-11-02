import "dotenv/config";
import { performance } from "perf_hooks";
import { analyzeWithJev } from "../src/lib/ai/jev-client";
import { generateEmbedding } from "../src/lib/ai/embeddings";
import { supabase } from "../src/lib/db/supabase";
import { GoogleGenAI } from "@google/genai";
import { SIRDAS_SYSTEM_CONSTITUTION } from "../src/lib/ai/constitution";

async function diagnose() {
  console.log("--- TTFT LATENCY DIAGNOSTIC ---");
  const msg = "İş yerinde haksızlığa uğradım, kalbim çok kırgın ve öfkeliyim, içim daralıyor...";

  // Phase 1: Parallel Jev + Embedding
  const t0 = performance.now();
  const [jevResult, embedding] = await Promise.all([
    analyzeWithJev({ userMessage: msg }),
    generateEmbedding(msg)
  ]);
  const tPhase1 = performance.now() - t0;
  console.log(`Phase 1 (Jev + Embedding): ${tPhase1.toFixed(1)}ms`);

  // Phase 2: Supabase RPC
  const t1 = performance.now();
  let chunks: any[] = [];
  try {
    const { data: ragResults, error } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 4,
      filter_category: jevResult.rag_category,
      filter_nafs: jevResult.nafs_trap,
      force_riba: false
    });
    if (error) {
      console.log("Supabase RPC error:", error.message);
    } else {
      chunks = ragResults || [];
    }
  } catch (err: any) {
    console.log("Supabase RPC exception:", err.message);
  }
  const tPhase2 = performance.now() - t1;
  console.log(`Phase 2 (Supabase match_knowledge_chunks RPC): ${tPhase2.toFixed(1)}ms (chunks: ${chunks.length})`);

  // Phase 3: Gemini generateContentStream
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const t2 = performance.now();
    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents: msg,
        config: { systemInstruction: SIRDAS_SYSTEM_CONSTITUTION }
      });
      let firstChunkTime = -1;
      let totalTokens = 0;
      for await (const chunk of stream) {
        if (firstChunkTime < 0) {
          firstChunkTime = performance.now() - t2;
        }
        totalTokens += (chunk.text || "").length;
      }
      const tPhase3 = performance.now() - t2;
      console.log(`Phase 3 (Gemini 3.8 Flash Stream): First chunk at ${firstChunkTime.toFixed(1)}ms, total stream ${tPhase3.toFixed(1)}ms (${totalTokens} chars)`);
      console.log(`TOTAL CALCULATED TTFT: ${(tPhase1 + tPhase2 + firstChunkTime).toFixed(1)}ms`);
    } catch (err: any) {
      console.log("Phase 3 Gemini Stream exception:", err.message);
    }
  }
}

diagnose();
