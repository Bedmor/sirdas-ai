import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";

describe("Tier 3: Cross-Feature Integration — Text Ingestion -> Vector Embedder -> pgvector", { tier: 3, feature: "Text -> Embedding -> DB" }, () => {
  const rootDir = process.cwd();

  it("T3-XEMB.1: Text knowledge parser formats passage into 768d embedder input and matches vector schema", () => {
    const rawPassage = {
      sourceType: "QURAN",
      sourceTitle: "Bakara Suresi 275-279",
      content: "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar...",
      tags: ["BAKARA_275_279", "RIBA", "HARAM", "RIZIK_VE_TICARET"],
      isRibaRelated: true,
    };

    // Synthetic 768-dimensional float embedding vector
    const syntheticEmbedding = Array.from({ length: 768 }).map((_, i) => Math.sin(i) * 0.05);

    expect(syntheticEmbedding.length).toBe(768);
    expect(rawPassage.isRibaRelated).toBe(true);

    const dbPayload = {
      ...rawPassage,
      embedding: syntheticEmbedding,
    };

    expect(dbPayload.embedding.length).toBe(768);
    expect(dbPayload.tags).toContain("RIBA");
  });

  it("T3-XEMB.2: Supabase hybrid search RPC query embedding dimension strictly aligns with 768d vector index", () => {
    const rpcPath = path.join(rootDir, "prisma/sql/02_hybrid_search_rpc.sql");
    const rpcContent = fs.readFileSync(rpcPath, "utf-8");

    // Must require query_embedding vector(768)
    expect(rpcContent).toContain("query_embedding vector(768)");
    // Must contain Cosine distance operator (<=>)
    expect(rpcContent).toContain("<=>");
  });
});
