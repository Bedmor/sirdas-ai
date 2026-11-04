import fs from "fs";
import path from "path";
import {
  getLocalKnowledgeCorpus,
  scoreChunkRelevance,
  extractMeaningfulKeywords,
} from "../src/lib/db/local-corpus";

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

async function run() {
  console.log("\n=======================================================");
  console.log("   MANEVİ PUSULA - AUTHENTIC CORPUS VERIFICATION TEST");
  console.log("=======================================================\n");

  const dataDir = path.join(process.cwd(), "data-pipeline/data");

  // 1. Hadith Dataset Integrity
  console.log("[1] Checking Hadith Kütüb-i Sitte Dataset...");
  const hadithPath = path.join(dataDir, "hadith_kutub_sitte.json");
  assert(fs.existsSync(hadithPath), "hadith_kutub_sitte.json exists");
  const hadiths = JSON.parse(fs.readFileSync(hadithPath, "utf-8"));
  assert(Array.isArray(hadiths) && hadiths.length >= 100, `Hadith count >= 100 (found: ${hadiths.length})`);

  let buhariCount = 0;
  let muslimCount = 0;
  let hasRibaHadith = false;
  hadiths.forEach((h: Record<string, unknown>) => {
    assert(Boolean(h.hadis_id), `Hadith has hadis_id (${h.hadis_id})`);
    assert(Boolean(h.kaynak), `Hadith has kaynak (${h.hadis_id})`);
    assert(Boolean(h.kitap_bolumu), `Hadith has kitap_bolumu (${h.hadis_id})`);
    assert(Boolean(h.turkce_meal), `Hadith has turkce_meal (${h.hadis_id})`);
    assert(Boolean(h.sahihlik_derecesi), `Hadith has sahihlik_derecesi (${h.hadis_id})`);
    assert(Array.isArray(h.kategori_etiketleri), `Hadith has kategori_etiketleri (${h.hadis_id})`);
    const kaynak = String(h.kaynak).toLowerCase();
    if (kaynak.includes("buhârî") || kaynak.includes("buhari")) buhariCount++;
    if (kaynak.includes("müslim") || kaynak.includes("muslim")) muslimCount++;
    if (h.is_riba_related) hasRibaHadith = true;
  });
  assert(buhariCount > 0, `Buhari hadiths present (${buhariCount})`);
  assert(muslimCount > 0, `Muslim hadiths present (${muslimCount})`);
  assert(hasRibaHadith, "Anti-usury / riba hadith package present");

  // 2. Siyer Kriz Matrisi Dataset Integrity
  console.log("\n[2] Checking Siyer-i Nebî Kriz Matrisi Dataset...");
  const siyerPath = path.join(dataDir, "siyer_kriz_matrisi.json");
  assert(fs.existsSync(siyerPath), "siyer_kriz_matrisi.json exists");
  const siyerEvents = JSON.parse(fs.readFileSync(siyerPath, "utf-8"));
  assert(Array.isArray(siyerEvents) && siyerEvents.length >= 100, `Siyer events >= 100 (found: ${siyerEvents.length})`);

  const eventNames = new Set<string>();
  siyerEvents.forEach((s: Record<string, unknown>) => {
    assert(Boolean(s.siyer_id), `Siyer event has siyer_id (${s.siyer_id})`);
    assert(Boolean(s.olay_adi), `Siyer event has olay_adi (${s.olay_adi})`);
    assert(Boolean(s.ozet_metin), `Siyer event has ozet_metin (${s.siyer_id})`);
    assert(Boolean(s.manevi_hikmet), `Siyer event has manevi_hikmet (${s.siyer_id})`);
    assert(Array.isArray(s.duygu_ve_kriz_etiketleri), `Siyer event has duygu_ve_kriz_etiketleri (${s.siyer_id})`);
    eventNames.add(String(s.olay_adi).toLowerCase());
  });

  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("taif")), "Taif event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("sevr")), "Sevr event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("uhud")), "Uhud event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("hendek")), "Hendek event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("ifk")), "İfk event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("hudeybiye")), "Hudeybiye event present");
  assert(siyerEvents.some((s: Record<string, unknown>) => String(s.siyer_id).includes("tebuk")), "Tebük event present");

  // 3. Tefsir & Nüzul Sebepleri Dataset Integrity
  console.log("\n[3] Checking Tefsir & Nüzul Sebepleri Dataset...");
  const tefsirPath = path.join(dataDir, "tefsir_hikmet_corpus.json");
  assert(fs.existsSync(tefsirPath), "tefsir_hikmet_corpus.json exists");
  const tefsirItems = JSON.parse(fs.readFileSync(tefsirPath, "utf-8"));
  assert(Array.isArray(tefsirItems) && tefsirItems.length >= 50, `Tefsir items >= 50 (found: ${tefsirItems.length})`);

  let bakaraRibaFound = false;
  tefsirItems.forEach((t: Record<string, unknown>) => {
    assert(Boolean(t.tefsir_id), `Tefsir item has tefsir_id (${t.tefsir_id})`);
    assert(Boolean(t.sure), `Tefsir item has sure (${t.tefsir_id})`);
    assert(Boolean(t.ayet_meali), `Tefsir item has ayet_meali (${t.tefsir_id})`);
    assert(Boolean(t.nuzul_sebebi_ve_tefsir), `Tefsir item has nuzul_sebebi_ve_tefsir (${t.tefsir_id})`);
    assert(Boolean(t.manevi_hikmet), `Tefsir item has manevi_hikmet (${t.tefsir_id})`);
    if (String(t.tefsir_id).includes("bakara_275_279")) {
      bakaraRibaFound = true;
      assert(Boolean(t.is_riba_related), "Bakara 275-279 has is_riba_related = true");
      const tags = (t.tags as string[]) || [];
      assert(tags.includes("BAKARA_275_279_TAG"), "Bakara 275-279 has BAKARA_275_279_TAG");
      assert(tags.includes("RIBA"), "Bakara 275-279 has RIBA tag");
    }
  });
  assert(bakaraRibaFound, "Bakara 275-279 tefsir package verified");

  // 4. Local Corpus Ingestion & RAG Matching
  console.log("\n[4] Checking In-Memory Local Knowledge Corpus Aggregation...");
  const corpus = getLocalKnowledgeCorpus();
  assert(corpus.length >= 250, `Local corpus aggregates all datasets (total chunks: ${corpus.length})`);

  const hadithChunks = corpus.filter((c) => c.sourceType === "HADITH");
  const siyerChunks = corpus.filter((c) => c.sourceType === "SIYER");
  const quranChunks = corpus.filter((c) => c.sourceType === "QURAN");

  assert(hadithChunks.length >= 100, `Hadith chunks loaded into local corpus (${hadithChunks.length})`);
  assert(siyerChunks.length >= 100, `Siyer chunks loaded into local corpus (${siyerChunks.length})`);
  assert(quranChunks.length >= 50, `Quran/Tafsir chunks loaded into local corpus (${quranChunks.length})`);

  // Test RAG relevance scoring on authentic questions
  console.log("\n[5] Testing RAG Relevance Matching on Real Life Queries...");
  
  // Case A: Taif & Disappointment
  const taifKeywords = extractMeaningfulKeywords("Beni herkes dışladı ve taşladı çok yalnız hissediyorum");
  const scoredTaif = corpus
    .map((c) => ({ chunk: c, score: scoreChunkRelevance(c, { userMessage: "Beni herkes dışladı" }, taifKeywords) }))
    .sort((a, b) => b.score - a.score);
  assert(
    scoredTaif.slice(0, 3).some((item) => item.chunk.sourceTitle.toLowerCase().includes("taif")),
    "Taif chunk successfully scored in top 3 for rejection/isolation query"
  );

  // Case B: Anger & Pehlivan
  const angerKeywords = extractMeaningfulKeywords("Çok öfkelendim kendime hakim olamıyorum");
  const scoredAnger = corpus
    .map((c) => ({ chunk: c, score: scoreChunkRelevance(c, { userMessage: "Çok öfkelendim" }, angerKeywords) }))
    .sort((a, b) => b.score - a.score);
  assert(
    scoredAnger.slice(0, 3).some((item) => item.chunk.tags.includes("OFKE_VE_AHLAK") || item.chunk.tags.includes("OFKE_KONTROLU")),
    "Öfke / Hilm chunk successfully scored in top 3 for anger query"
  );

  // Case C: Sevr Mağarası & Fear
  const sevrKeywords = extractMeaningfulKeywords("Çok korkuyorum köşeye sıkıştım ne yapacağım");
  const scoredSevr = corpus
    .map((c) => ({ chunk: c, score: scoreChunkRelevance(c, { userMessage: "Çok korkuyorum köşeye sıkıştım" }, sevrKeywords) }))
    .sort((a, b) => b.score - a.score);
  assert(
    scoredSevr.slice(0, 5).some((item) => item.chunk.sourceTitle.toLowerCase().includes("sevr") || item.chunk.tags.includes("TEVEKKUL_VE_MURAKABE")),
    "Sevr / Tevekkül chunk successfully scored in top 5 for fear/cornered query"
  );

  // 6. Check for banned word
  console.log("\n[6] Checking Banned Words across All Authentic Datasets...");
  let bannedWordFound = false;
  for (const c of corpus) {
    if (c.content.toLowerCase().includes("sekinet") || c.sourceTitle.toLowerCase().includes("sekinet")) {
      bannedWordFound = true;
      console.error(`Banned word 'sekinet' found in chunk: ${c.sourceTitle}`);
    }
  }
  assert(!bannedWordFound, "No banned word ('sekinet') in entire aggregated knowledge corpus");

  console.log("\n=======================================================");
  console.log(`   RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test runner threw fatal error:", err);
  process.exit(1);
});
