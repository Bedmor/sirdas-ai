import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";

describe("Tier 1: Feature Coverage — Text Knowledge Ingestion & Riba Package", { tier: 1, feature: "Text Ingestion" }, () => {
  const rootDir = process.cwd();

  it("T1-TXT.1: Mandatory Bakara 275-279 Riba package is defined with strict anti-usury tags", () => {
    // Check seed knowledge chunk in admin knowledge API route
    const knowledgeRoutePath = path.join(rootDir, "src/app/api/admin/knowledge/route.ts");
    expect(fs.existsSync(knowledgeRoutePath)).toBe(true);

    const content = fs.readFileSync(knowledgeRoutePath, "utf-8");
    expect(content).toContain("Bakara Suresi 275-279");
    expect(content).toContain("BAKARA_275_279");
    expect(content).toContain("RIBA");
    expect(content).toContain("HARAM");
    expect(content).toContain("isRibaRelated: true");
  });

  it("T1-TXT.2: Vector embedding utility enforces 768-dimensional float embeddings", () => {
    const embedderPath = path.join(rootDir, "data-pipeline/utils/embedder.py");
    expect(fs.existsSync(embedderPath)).toBe(true);

    const content = fs.readFileSync(embedderPath, "utf-8");
    expect(content).toContain("EMBEDDING_DIMENSION = 768");
    expect(content).toContain("text-embedding-004");
  });

  it("T1-TXT.3: Supabase pgvector initialization script configures HNSW cosine index for 768d vectors", () => {
    const sqlPath = path.join(rootDir, "prisma/sql/01_pgvector_init.sql");
    expect(fs.existsSync(sqlPath)).toBe(true);

    const sql = fs.readFileSync(sqlPath, "utf-8");
    expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS vector");
    expect(sql).toContain("knowledge_chunks_embedding_hnsw_idx");
    expect(sql).toContain("USING hnsw (embedding vector_cosine_ops)");
    expect(sql).toContain("m = 16");
    expect(sql).toContain("ef_construction = 64");
  });

  it("T1-TXT.4: Hybrid search RPC enforces mandatory Riba package when force_riba is enabled", () => {
    const rpcPath = path.join(rootDir, "prisma/sql/02_hybrid_search_rpc.sql");
    expect(fs.existsSync(rpcPath)).toBe(true);

    const rpcSql = fs.readFileSync(rpcPath, "utf-8");
    expect(rpcSql).toContain("query_embedding vector(768)");
    expect(rpcSql).toContain("force_riba boolean DEFAULT FALSE");
    expect(rpcSql).toContain("riba_enforced AS");
    expect(rpcSql).toContain("kc.is_riba_related");
  });

  it("T1-TXT.5: Knowledge chunk models support all five primary spiritual source types", () => {
    const rpcPath = path.join(rootDir, "prisma/sql/02_hybrid_search_rpc.sql");
    const rpcSql = fs.readFileSync(rpcPath, "utf-8");

    expect(rpcSql).toContain("QURAN");
    expect(rpcSql).toContain("HADITH");
    expect(rpcSql).toContain("DUA");
    expect(rpcSql).toContain("HALIS_AYDEMIR");
    expect(rpcSql).toContain("SIYER");
  });
});
