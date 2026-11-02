import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const jsonPath = path.join(process.cwd(), "data-pipeline/data/quran_semantic_passages.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Passages file not found:", jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const passages = JSON.parse(raw);
  console.log(`Loaded ${passages.length} enriched passages from JSON.`);

  console.log("Syncing tags, nafsTraps, and isRibaRelated to PostgreSQL...");
  const t0 = performance.now();

  let updatedCount = 0;
  const batchSize = 25;

  for (let i = 0; i < passages.length; i += batchSize) {
    const chunk = passages.slice(i, i + batchSize);
    
    await Promise.all(
      chunk.map((item: any) =>
        prisma.knowledgeChunk.updateMany({
          where: { id: item.id },
          data: {
            tags: item.tags,
            nafsTraps: item.nafs_traps,
            isRibaRelated: Boolean(item.is_riba_related)
          }
        })
      )
    );

    updatedCount += chunk.length;
    if (updatedCount % 100 === 0 || updatedCount === passages.length) {
      console.log(`Synced ${updatedCount} / ${passages.length} passages to DB...`);
    }
  }

  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  console.log(`\n=======================================================`);
  console.log(`✅ SYNC COMPLETE in ${elapsed}s! Total records updated: ${updatedCount}`);
  console.log(`=======================================================\n`);

  // Final verification check
  const all = await prisma.knowledgeChunk.findMany({
    select: { id: true, sourceTitle: true, tags: true, nafsTraps: true, isRibaRelated: true }
  });
  const emptyTraps = all.filter(c => !c.nafsTraps || c.nafsTraps.length === 0);
  const sparseTags = all.filter(c => !c.tags || c.tags.length <= 2);
  const ribaCount = all.filter(c => c.isRibaRelated);

  console.log(`Database Statistics:`);
  console.log(`- Total Chunks in DB: ${all.length}`);
  console.log(`- Chunks with empty nafs_traps: ${emptyTraps.length}`);
  console.log(`- Chunks with <= 2 tags: ${sparseTags.length}`);
  console.log(`- Total Riba-related Chunks: ${ribaCount.length}`);

  const sample = all.find(c => c.sourceTitle.includes("Talâk") || c.sourceTitle.includes("Bakara 275"));
  if (sample) {
    console.log(`\nSample Chunk (${sample.sourceTitle}):`);
    console.log(`Tags:`, sample.tags);
    console.log(`Nafs Traps:`, sample.nafsTraps);
    console.log(`isRibaRelated:`, sample.isRibaRelated);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
