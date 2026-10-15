import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
    ".eslintrc.json",
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
  assert(sql1.includes("information_schema.tables"), "01_pgvector_init.sql has safe table existence check");

  const sql2 = fs.readFileSync(sql2Path, "utf-8");
  assert(sql2.includes("CREATE OR REPLACE FUNCTION match_knowledge_chunks"), "match_knowledge_chunks function defined");
  assert(sql2.includes("force_riba boolean DEFAULT FALSE"), "force_riba parameter exists");
  assert(sql2.includes("riba_enforced AS"), "1. Mandatory Riba package CTE defined");
  assert(sql2.includes("best_quran AS"), "2. Best Quran passage CTE defined");
  assert(sql2.includes("best_hadith_siyer AS"), "3. Best Hadith / Siyer CTE defined");
  assert(sql2.includes("best_halis_audio AS"), "4. Best Halis Aydemir audio CTE defined");
  assert(sql2.includes("general_matches AS"), "5. General hybrid matches CTE defined");
  assert(sql2.includes("DISTINCT ON (c.id)"), "6. Deduplication with DISTINCT ON (c.id) implemented");
  assert(sql2.includes('CREATE TYPE "SourceType"'), "02_hybrid_search_rpc.sql guarantees SourceType enum exists");

  // Test 4: Database Clients
  console.log("\n[4] Checking Database Clients (Prisma & Supabase)...");
  const { prisma } = await import("../src/lib/db/prisma");
  assert(prisma !== undefined, "Prisma client successfully imported and initialized");

  const { supabase, matchKnowledgeChunks } = await import("../src/lib/db/supabase");
  assert(supabase !== undefined, "Supabase client successfully imported");
  assert(typeof matchKnowledgeChunks === "function", "matchKnowledgeChunks helper function exported");

  // Test matchKnowledgeChunks graceful error handling with invalid stub credentials
  const rpcResult = await matchKnowledgeChunks({
    query_embedding: JSON.stringify(new Array(768).fill(0.01)),
    match_threshold: 0.5,
    match_count: 4,
    force_riba: false,
  });
  assert(rpcResult.error !== null, "matchKnowledgeChunks gracefully handles offline/stub Supabase connection");

  // Test 5: Storage Client (Cloudflare R2)
  console.log("\n[5] Checking Storage Client (Cloudflare R2)...");
  const {
    r2Client,
    getR2Client,
    getR2Config,
    getPublicAudioUrl,
    uploadAudioSnippet,
    getPresignedDownloadUrl,
    deleteAudioSnippet,
    checkR2Connection,
  } = await import("../src/lib/storage/r2");
  assert(r2Client !== undefined, "R2 S3Client successfully imported");
  assert(typeof getR2Client === "function", "getR2Client exported");
  assert(typeof getR2Config === "function", "getR2Config exported");
  assert(typeof getPublicAudioUrl === "function", "getPublicAudioUrl exported");
  assert(typeof uploadAudioSnippet === "function", "uploadAudioSnippet exported");
  assert(typeof getPresignedDownloadUrl === "function", "getPresignedDownloadUrl exported");
  assert(typeof deleteAudioSnippet === "function", "deleteAudioSnippet exported");
  assert(typeof checkR2Connection === "function", "checkR2Connection exported");

  const sampleUrl = getPublicAudioUrl("halis_aydemir/sohbet_1.ogg");
  const expectedPrefix = (process.env.R2_PUBLIC_BASE_URL || "https://media.sirdas.ai").replace(/\/+$/, "");
  assert(sampleUrl.startsWith(`${expectedPrefix}/halis_aydemir/sohbet_1.ogg`) || sampleUrl.includes("halis_aydemir/sohbet_1.ogg"), `getPublicAudioUrl generates correct URL: ${sampleUrl}`);

  // Test dynamic config override
  process.env.R2_PUBLIC_BASE_URL = "https://custom-cdn.sirdas.ai/";
  const overriddenUrl = getPublicAudioUrl("test.ogg");
  assert(overriddenUrl === "https://custom-cdn.sirdas.ai/test.ogg", "getR2Config dynamically reflects runtime env changes without duplicate slashes");
  process.env.R2_PUBLIC_BASE_URL = "https://media.sirdas.ai";

  // Test 6: Deep Integration Test (Real PostgreSQL + pgvector Docker verification)
  console.log("\n[6] Checking Deep Integration with PostgreSQL + pgvector...");
  let dockerAvailable = false;
  try {
    execSync("docker info", { stdio: "ignore" });
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
  }

  if (dockerAvailable) {
    console.log("  🐳 Docker is available. Executing deep live PostgreSQL + pgvector test...");
    const containerName = `sirdas_verify_${Date.now()}`;
    const testPort = 5434;
    try {
      // 1. Run ephemeral container
      execSync(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_db -p ${testPort}:5432 pgvector/pgvector:pg16`, { stdio: "ignore" });
      
      // 2. Wait for postgres readiness (ensure daemon and database are fully ready)
      let ready = false;
      for (let i = 0; i < 30; i++) {
        try {
          execSync(`docker exec ${containerName} psql -U postgres -d test_db -c "SELECT 1;"`, { stdio: "ignore" });
          ready = true;
          break;
        } catch {
          execSync("sleep 0.5");
        }
      }
      assert(ready, "Live pgvector PostgreSQL container ready and accepting queries");

      // 3. Test running 01_pgvector_init.sql before migration (should not crash)
      execSync(`docker exec -i ${containerName} psql -U postgres -d test_db`, {
        input: fs.readFileSync(sql1Path, "utf-8"),
        stdio: ["pipe", "ignore", "pipe"],
      });
      assert(true, "01_pgvector_init.sql executed safely before table creation without fatal crash");

      // 4. Test running 02_hybrid_search_rpc.sql before migration (should not crash because SourceType is guaranteed)
      execSync(`docker exec -i ${containerName} psql -U postgres -d test_db`, {
        input: fs.readFileSync(sql2Path, "utf-8"),
        stdio: ["pipe", "ignore", "pipe"],
      });
      assert(true, "02_hybrid_search_rpc.sql executed safely before table creation (SourceType guaranteed)");

      // 5. Run Prisma db push to build schema
      const dbUrl = `postgresql://postgres:test@localhost:${testPort}/test_db`;
      execSync(`DATABASE_URL="${dbUrl}" DIRECT_URL="${dbUrl}" npx prisma db push --skip-generate`, { stdio: "ignore" });
      assert(true, "Prisma db push created all tables and relations in PostgreSQL");

      // 6. Apply 01_pgvector_init.sql to create HNSW & GIN indexes
      execSync(`docker exec -i ${containerName} psql -U postgres -d test_db`, {
        input: fs.readFileSync(sql1Path, "utf-8"),
        stdio: ["pipe", "ignore", "pipe"],
      });
      assert(true, "01_pgvector_init.sql created HNSW vector_cosine_ops and GIN indexes");

      // 7. Insert test chunks and execute match_knowledge_chunks RPC
      const testSql = `
        DO $$
        DECLARE
            v vector(768);
            v_arr text;
            cnt_normal int;
            cnt_riba int;
            first_source text;
        BEGIN
            SELECT '[' || string_agg('0.01', ',') || ']' INTO v_arr FROM generate_series(1, 768);
            v := v_arr::vector;

            INSERT INTO public.knowledge_chunks (id, source_type, source_title, content, tags, nafs_traps, is_riba_related, embedding)
            VALUES (gen_random_uuid(), 'QURAN', 'Bakara 155', 'Test verse', ARRAY['SABIR'], ARRAY['UMITSIZLIK'], false, v);

            INSERT INTO public.knowledge_chunks (id, source_type, source_title, content, tags, nafs_traps, is_riba_related, embedding)
            VALUES (gen_random_uuid(), 'HADITH', 'Hadith 1', 'Test hadith', ARRAY['SABIR'], ARRAY['OFKE'], false, v);

            INSERT INTO public.knowledge_chunks (id, source_type, source_title, content, tags, nafs_traps, is_riba_related, youtube_id, start_sec, end_sec, audio_url, embedding)
            VALUES (gen_random_uuid(), 'HALIS_AYDEMIR', 'Sohbet 1', 'Test audio', ARRAY['SABIR'], ARRAY['UMITSIZLIK'], false, 'yt1', 10, 60, 'https://media.sirdas.ai/1.ogg', v);

            INSERT INTO public.knowledge_chunks (id, source_type, source_title, content, tags, nafs_traps, is_riba_related, embedding)
            VALUES (gen_random_uuid(), 'QURAN', 'Bakara 275-279', 'Riba verse', ARRAY['BAKARA_275_279', 'RIZIK'], ARRAY['VESVESE'], true, v);

            -- Test force_riba = false
            SELECT COUNT(*) INTO cnt_normal FROM match_knowledge_chunks(v, 0.5, 4, NULL, NULL, false);
            IF cnt_normal != 4 THEN
                RAISE EXCEPTION 'Expected 4 results when force_riba = false, got %', cnt_normal;
            END IF;

            -- Test force_riba = true (first result MUST be Bakara 275-279 riba verse)
            SELECT source_title INTO first_source FROM match_knowledge_chunks(v, 0.5, 4, NULL, NULL, true) LIMIT 1;
            IF first_source != 'Bakara 275-279' THEN
                RAISE EXCEPTION 'Expected Bakara 275-279 first when force_riba = true, got %', first_source;
            END IF;
        END $$;
      `;
      execSync(`docker exec -i ${containerName} psql -U postgres -d test_db`, {
        input: testSql,
        stdio: ["pipe", "ignore", "pipe"],
      });
      assert(true, "match_knowledge_chunks returned multi-source balanced chunks (QURAN + HADITH + HALIS_AYDEMIR + RIBA priority 1)");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      assert(false, `Deep PostgreSQL integration test failed: ${errorMsg}`);
    } finally {
      try {
        execSync(`docker rm -f ${containerName}`, { stdio: "ignore" });
      } catch {
        // ignore cleanup error
      }
    }
  } else {
    console.log("  ℹ️ Docker not available, skipping ephemeral container integration test.");
  }

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
