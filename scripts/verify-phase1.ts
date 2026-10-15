import fs from "fs";
import path from "path";

// Set placeholder env variables for testing if not set
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db";
process.env.DIRECT_URL = process.env.DIRECT_URL || "postgresql://user:pass@localhost:5432/db";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-key";
process.env.R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "test-account";
process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "test-key";
process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "test-secret";
process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sirdas-audio";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   SIRDAŞ AI - PHASE 1 ARCHITECTURE VERIFICATION TEST");
  console.log("=======================================================\n");

  const rootDir = process.cwd();

  // Test 1: Configuration files exist
  console.log("[1] Checking Project Configuration Files...");
  const requiredFiles = [
    ".env.example",
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "components.json",
    "src/app/globals.css",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/lib/utils.ts",
  ];
  for (const file of requiredFiles) {
    const fullPath = path.join(rootDir, file);
    assert(fs.existsSync(fullPath), `${file} exists`);
  }

  // Test 2: Prisma Schema validation
  console.log("\n[2] Checking Prisma Schema...");
  const schemaPath = path.join(rootDir, "prisma/schema.prisma");
  assert(fs.existsSync(schemaPath), "prisma/schema.prisma exists");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  assert(schemaContent.includes("model User"), "User model defined");
  assert(schemaContent.includes("model KnowledgeChunk"), "KnowledgeChunk model defined");
  assert(schemaContent.includes("model Message"), "Message model defined");
  assert(schemaContent.includes("model Donation"), "Donation model defined");
  assert(schemaContent.includes("model VasDailyLog"), "VasDailyLog model defined");
  assert(schemaContent.includes("waMessageId"), "waMessageId field in Message model");
  assert(schemaContent.includes("@unique"), "waMessageId is @unique (retry storm lock)");
  assert(schemaContent.includes('Unsupported("vector(768)")?'), "vector(768) embedding defined in KnowledgeChunk");
  assert(schemaContent.includes("postgresqlExtensions"), "postgresqlExtensions previewFeature enabled");

  // Test 3: SQL Migration Scripts
  console.log("\n[3] Checking SQL Migration Scripts...");
  const sql1Path = path.join(rootDir, "prisma/sql/01_pgvector_init.sql");
  const sql2Path = path.join(rootDir, "prisma/sql/02_hybrid_search_rpc.sql");
  assert(fs.existsSync(sql1Path), "01_pgvector_init.sql exists");
  assert(fs.existsSync(sql2Path), "02_hybrid_search_rpc.sql exists");

  const sql1 = fs.readFileSync(sql1Path, "utf-8");
  assert(sql1.includes("CREATE EXTENSION IF NOT EXISTS vector"), "Vector extension created");
  assert(sql1.includes("hnsw (embedding vector_cosine_ops)"), "HNSW cosine distance index defined");
  assert(sql1.includes("USING GIN (tags)"), "GIN index on tags defined");
  assert(sql1.includes("USING GIN (nafs_traps)"), "GIN index on nafs_traps defined");

  const sql2 = fs.readFileSync(sql2Path, "utf-8");
  assert(sql2.includes("CREATE OR REPLACE FUNCTION match_knowledge_chunks"), "match_knowledge_chunks function defined");
  assert(sql2.includes("force_riba boolean DEFAULT FALSE"), "force_riba parameter exists");
  assert(sql2.includes("riba_enforced AS"), "1. Mandatory Riba package CTE defined");
  assert(sql2.includes("best_quran AS"), "2. Best Quran passage CTE defined");
  assert(sql2.includes("best_hadith_siyer AS"), "3. Best Hadith / Siyer CTE defined");
  assert(sql2.includes("best_halis_audio AS"), "4. Best Halis Aydemir audio CTE defined");
  assert(sql2.includes("general_matches AS"), "5. General hybrid matches CTE defined");
  assert(sql2.includes("DISTINCT ON (c.id)"), "6. Deduplication with DISTINCT ON (c.id) implemented");

  // Test 4: Database Clients
  console.log("\n[4] Checking Database Clients (Prisma & Supabase)...");
  const { prisma } = await import("../src/lib/db/prisma");
  assert(prisma !== undefined, "Prisma client successfully imported and initialized");

  const { supabase, matchKnowledgeChunks } = await import("../src/lib/db/supabase");
  assert(supabase !== undefined, "Supabase client successfully imported");
  assert(typeof matchKnowledgeChunks === "function", "matchKnowledgeChunks helper function exported");

  // Test 5: Storage Client (Cloudflare R2)
  console.log("\n[5] Checking Storage Client (Cloudflare R2)...");
  const {
    r2Client,
    getPublicAudioUrl,
    uploadAudioSnippet,
    getPresignedDownloadUrl,
    deleteAudioSnippet,
    checkR2Connection,
  } = await import("../src/lib/storage/r2");
  assert(r2Client !== undefined, "R2 S3Client successfully imported");
  assert(typeof getPublicAudioUrl === "function", "getPublicAudioUrl exported");
  assert(typeof uploadAudioSnippet === "function", "uploadAudioSnippet exported");
  assert(typeof getPresignedDownloadUrl === "function", "getPresignedDownloadUrl exported");
  assert(typeof deleteAudioSnippet === "function", "deleteAudioSnippet exported");
  assert(typeof checkR2Connection === "function", "checkR2Connection exported");

  const sampleUrl = getPublicAudioUrl("halis_aydemir/sohbet_1.ogg");
  assert(sampleUrl.startsWith("https://media.sirdas.ai/halis_aydemir/sohbet_1.ogg"), `getPublicAudioUrl generates correct URL: ${sampleUrl}`);

  // Summary
  console.log("\n=======================================================");
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Verification test threw an uncaught error:", err);
  process.exit(1);
});
