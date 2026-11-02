import fs from "fs";
import path from "path";

export type LocalSourceType =
  | "QURAN"
  | "HADITH"
  | "DUA"
  | "HALIS_AYDEMIR"
  | "SIYER";

export interface LocalKnowledgeChunk {
  id: string;
  sourceType: LocalSourceType;
  sourceTitle: string;
  content: string;
  tags: string[];
  nafsTraps: string[];
  isRibaRelated: boolean;
  youtubeId: string | null;
  startSec: number | null;
  endSec: number | null;
  audioUrl: string | null;
  createdAt: Date;
}

const globalForDbCircuit = globalThis as unknown as {
  remoteDbOfflineUntil?: number;
};

/**
 * Shared circuit breaker across Prisma and Supabase REST RPC so that when the
 * remote Supabase instance is paused/unreachable, neither client wastes time on
 * repeated connection timeouts.
 */
export function isRemoteDbOffline(): boolean {
  return Date.now() < (globalForDbCircuit.remoteDbOfflineUntil ?? 0);
}

export function markRemoteDbOffline(cooldownMs = 60_000): void {
  globalForDbCircuit.remoteDbOfflineUntil = Date.now() + cooldownMs;
}


/**
 * Comprehensive Turkish stop-words list so RAG keyword search never matches
 * generic filler words like "çok", "bir", "var", "için", "gibi", "bana".
 */
export const TURKISH_STOP_WORDS = new Set<string>([
  "acaba",
  "ama",
  "ancak",
  "artık",
  "artik",
  "asla",
  "az",
  "bana",
  "bazen",
  "bazı",
  "bazi",
  "belki",
  "ben",
  "bende",
  "benden",
  "beni",
  "benim",
  "beri",
  "bile",
  "bir",
  "biraz",
  "birçok",
  "bircok",
  "biri",
  "birkaç",
  "birkac",
  "birşey",
  "birsey",
  "biz",
  "bize",
  "bizi",
  "bizim",
  "böyle",
  "boyle",
  "bu",
  "buna",
  "bunda",
  "bundan",
  "bunlar",
  "bunu",
  "bunun",
  "burada",
  "bütün",
  "butun",
  "çoğu",
  "cogu",
  "çok",
  "cok",
  "çünkü",
  "cunku",
  "da",
  "daha",
  "dahi",
  "de",
  "defa",
  "değil",
  "degil",
  "diğer",
  "diger",
  "diye",
  "dolayı",
  "dolayi",
  "eden",
  "eder",
  "ediyorum",
  "eğer",
  "eger",
  "en",
  "etmek",
  "etti",
  "fakat",
  "falan",
  "fazla",
  "filan",
  "gibi",
  "göre",
  "gore",
  "hala",
  "halde",
  "halen",
  "hangi",
  "hani",
  "hatta",
  "hem",
  "henüz",
  "henuz",
  "hep",
  "hepsi",
  "her",
  "herhangi",
  "herkes",
  "hiç",
  "hic",
  "hiçbir",
  "hicbir",
  "için",
  "icin",
  "içinde",
  "icinde",
  "iki",
  "ile",
  "ilgili",
  "ise",
  "işte",
  "iste",
  "istiyorum",
  "kadar",
  "karşı",
  "karsi",
  "kendi",
  "kendime",
  "kendimi",
  "kendine",
  "kendini",
  "kez",
  "ki",
  "kim",
  "kime",
  "kimi",
  "kimse",
  "mı",
  "mi",
  "mu",
  "mü",
  "nasıl",
  "nasil",
  "ne",
  "neden",
  "nedir",
  "nerde",
  "nerede",
  "nereye",
  "niçin",
  "nicin",
  "niye",
  "o",
  "olan",
  "olarak",
  "oldu",
  "olduğu",
  "oldugu",
  "olsa",
  "olsun",
  "olup",
  "olur",
  "oluyor",
  "ona",
  "ondan",
  "onlar",
  "onu",
  "onun",
  "orada",
  "öyle",
  "oyle",
  "pek",
  "rağmen",
  "ragmen",
  "sadece",
  "sanki",
  "sen",
  "senden",
  "seni",
  "senin",
  "siz",
  "size",
  "sizi",
  "sizin",
  "sonra",
  "öyle",
  "şey",
  "sey",
  "şimdi",
  "simdi",
  "şöyle",
  "soyle",
  "şu",
  "su",
  "şuna",
  "şunlar",
  "şunu",
  "tabi",
  "tam",
  "tüm",
  "tum",
  "üzere",
  "uzere",
  "var",
  "vardı",
  "ve",
  "veya",
  "ya",
  "yani",
  "yapacağım",
  "yapacagim",
  "yapmalıyım",
  "yapmaliyim",
  "yapayım",
  "yapayim",
  "yok",
  "yoksa",
  "zaten",
]);

/**
 * Extracts meaningful domain keywords (stems >= 3 chars, excluding stop-words).
 */
export function extractMeaningfulKeywords(text: string, maxWords = 8): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !TURKISH_STOP_WORDS.has(w));

  const unique: string[] = [];
  for (const w of words) {
    // Also add a 5-char Turkish stem for agglutinative suffix tolerance (e.g. "borcum" -> "borc", "öfkeleniyorum" -> "öfkel")
    const stem = w.length >= 6 ? w.slice(0, 5) : w;
    if (!unique.includes(w)) unique.push(w);
    if (stem.length >= 4 && !unique.includes(stem)) unique.push(stem);
    if (unique.length >= maxWords) break;
  }
  return unique;
}

const CORE_SEED_CHUNKS: LocalKnowledgeChunk[] = [
  {
    id: "chunk-quran-1",
    sourceType: "QURAN",
    sourceTitle: "Bakara Suresi 275-279",
    content:
      "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar. Bu onların 'Alışveriş de faiz gibidir' demelerindendir. Oysa Allah alışverişi helal, faizi haram kılmıştır. Kime Rabbinden bir öğüt gelir de faizden vazgeçerse geçmişi kendisine aittir... Eğer faizden vazgeçmezseniz Allah ve Resulü tarafından açılmış bir harbi bilin!",
    tags: [
      "BAKARA_275_279",
      "RIBA",
      "HARAM",
      "RIZIK_VE_TICARET",
      "faiz",
      "riba",
      "borc_krizi",
    ],
    nafsTraps: ["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"],
    isRibaRelated: true,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "chunk-quran-2",
    sourceType: "QURAN",
    sourceTitle: "Talâk Suresi 2-3",
    content:
      "Kim Allah'tan korkup sakınırsa, Allah ona bir çıkış yolu açar ve onu beklemediği yerden rızıklandırır. Kim Allah'a tevekkül ederse, O kendisine yeter. Şüphesiz Allah, emrini yerine getirendir.",
    tags: [
      "TALAK_2_3",
      "TEVEKKUL_VE_MURAKABE",
      "CIKIS_YOLU",
      "RIZIK_VE_TICARET",
      "TESKIN_VE_TESELLI",
    ],
    nafsTraps: [
      "UMITSIZLIK_KARAMSARLIK",
      "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK",
      "FAKIRLIK_KORKUSU_VESVESESI",
      "DUNYALIK_KAYGI",
    ],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:01:00Z"),
  },
  {
    id: "chunk-hadith-1",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Birr 69)",
    content:
      "Peygamber Efendimiz (s.a.v.) buyurdu: 'Sadaka vermekle mal eksilmez. Kul affettikçe Allah onun izzet ve şerefini artırır. Kim Allah için tevazu gösterirse, Allah onu yüceltir.'",
    tags: [
      "INFAK",
      "SADAKA",
      "ISRAF_VE_IKTISAT_FIKHI",
      "KALP_AMELLELI_VE_IHLAS",
      "KALP_AMELLERI_VE_IHLAS",
      "OFKE_VE_AHLAK",
    ],
    nafsTraps: [
      "CIMRILIK_VE_MAL_HIRSI",
      "MINNET_VE_BASA_KAKMA",
      "GIZLI_KIBIR_HAKLILIK",
      "INTIKAM_VE_HASET",
    ],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:02:00Z"),
  },
  {
    id: "chunk-siyer-1",
    sourceType: "SIYER",
    sourceTitle: "Taif Dönüşü Hz. Peygamber'in (s.a.v.) İhlas Duası",
    content:
      "Allah'ım! Güçsüzlüğümü, zaafımı ve insanların gözündeki değersizliğimi Sana arz ediyorum. Ey merhametlilerin en merhametlisi! Beni kime bırakıyorsun? Bana kaba davranan bir yabancıya mı, yoksa emrimi eline verdiğin bir düşmana mı? Eğer bana karşı bir gazabın yoksa, çektiğim sıkıntılara aldırmam...",
    tags: [
      "TAIF",
      "SIYERDE_DARLIK_DONEMLERI",
      "SIYER_ORNEKLERI",
      "DUA_VE_ILCA_USULU",
      "KADER_VE_KAZA_HIKMETI",
      "SABIR_VE_MUSIBET",
    ],
    nafsTraps: [
      "KADERE_ITIRAZ_VE_ISYAN",
      "ACELECI_TALEPLER_VE_ISTIACAL",
      "UMITSIZLIK_KARAMSARLIK",
    ],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:06:00Z"),
  },
];

let cachedCorpus: LocalKnowledgeChunk[] | null = null;

function enrichTagsAndTraps(raw: {
  sourceTitle: string;
  content: string;
  tags: string[];
  nafsTraps: string[];
  isRibaRelated: boolean;
}): { tags: string[]; nafsTraps: string[] } {
  const tags = new Set<string>(raw.tags || []);
  const traps = new Set<string>(raw.nafsTraps || []);
  const text = `${raw.sourceTitle} ${raw.content}`.toLowerCase();

  if (raw.isRibaRelated || /faiz|riba|borç|borc/.test(text)) {
    tags.add("RIZIK_VE_TICARET");
    tags.add("RIBA");
    traps.add("FAKIRLIK_KORKUSU_VESVESESI");
    traps.add("KOLAY_KAZANC_HIRSI");
  }
  if (/rızık|rizik|ticaret|bereket|helal|sebepler/.test(text)) {
    tags.add("RIZIK_VE_TICARET");
    tags.add("TEVEKKUL_VE_MURAKABE");
    traps.add("FAKIRLIK_KORKUSU_VESVESESI");
    traps.add("DUNYALIK_KAYGI");
    traps.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK");
  }
  if (/inşirah|ferahlık|darlık|sıkıntı|bunalım|göğsünü|terk etmedi|duha/.test(text)) {
    tags.add("TESKIN_VE_TESELLI");
    tags.add("SABIR_VE_MUSIBET");
    traps.add("UMITSIZLIK_KARAMSARLIK");
  }
  if (/aile|eşler|nesil|hanım|merhamet/.test(text)) {
    tags.add("AILE_VE_SILA_I_RAHIM");
    traps.add("KAYITSIZLIK_VE_MERHAMETSIZLIK");
    traps.add("GIZLI_KIBIR_HAKLILIK");
  }
  if (/öfke|pehlivan|hiddet|affet/.test(text)) {
    tags.add("OFKE_VE_AHLAK");
    traps.add("INTIKAM_VE_HASET");
    traps.add("GIZLI_KIBIR_HAKLILIK");
  }
  if (/müflis|kul hakkı|iftira|haksızlık|adalet/.test(text)) {
    tags.add("KUL_HAKKI_VE_ADALET");
    traps.add("MINNET_VE_BASA_KAKMA");
    traps.add("SUI_ZAN_VE_TECESSUS");
    traps.add("INTIKAM_VE_HASET");
  }
  if (/tevbe|tövbe|istiğfar|bağışla|günah/.test(text)) {
    tags.add("TEVBE_VE_INABE");
    tags.add("DUA_VE_ILCA_USULU");
    traps.add("GECMISIN_PISMANLIK_GIRDABI");
  }
  if (/ihsan|görüyormuş gibi|murakabe|kalp|kalpler/.test(text)) {
    tags.add("KALP_AMELLERI_VE_IHLAS");
    tags.add("KALP_AMELLELI_VE_IHLAS");
    tags.add("TEVEKKUL_VE_MURAKABE");
    traps.add("VESVESE_VE_GUSUL_ABDEST_EVHAMI");
    traps.add("ELALEM_NE_DER_RIYA");
  }
  if (/ölüm|ahiret|lezzetleri/.test(text)) {
    tags.add("FANILIK_VE_TAZIYE");
    traps.add("TUL_I_EMEL_VE_GAYETSIZLIK");
  }
  if (/sadaka|infak|israf|kanaat|ebubekir/.test(text)) {
    tags.add("ISRAF_VE_IKTISAT_FIKHI");
    traps.add("CIMRILIK_VE_MAL_HIRSI");
  }
  if (/kader|keşke|musibet/.test(text)) {
    tags.add("KADER_VE_KAZA_HIKMETI");
    tags.add("SABIR_VE_MUSIBET");
    traps.add("KADERE_ITIRAZ_VE_ISYAN");
  }
  if (/taif|uhud|sevr|hicret|tebük/.test(text)) {
    tags.add("SIYER_ORNEKLERI");
    tags.add("SIYERDE_DARLIK_DONEMLERI");
  }

  return {
    tags: Array.from(tags),
    nafsTraps: Array.from(traps),
  };
}

export function getLocalKnowledgeCorpus(): LocalKnowledgeChunk[] {
  if (cachedCorpus) return cachedCorpus;

  const byId = new Map<string, LocalKnowledgeChunk>();
  for (const chunk of CORE_SEED_CHUNKS) {
    byId.set(chunk.id, chunk);
  }

  try {
    const thematicPath = path.join(
      process.cwd(),
      "data-pipeline/data/thematic_texts.json"
    );
    if (fs.existsSync(thematicPath)) {
      const rawJson = JSON.parse(fs.readFileSync(thematicPath, "utf-8"));
      if (Array.isArray(rawJson)) {
        rawJson.forEach((item: Record<string, unknown>, idx: number) => {
          const id = String(item.id || `thematic-${idx}`);
          const sourceType = String(
            item.source_type || item.sourceType || "QURAN"
          ) as LocalSourceType;
          const sourceTitle = String(
            item.source_title || item.sourceTitle || "Kaynak"
          );
          const content = String(item.content || "");
          const isRibaRelated = Boolean(
            item.is_riba_related ?? item.isRibaRelated ?? false
          );
          const rawTags = Array.isArray(item.tags)
            ? item.tags.map(String)
            : [];
          const rawTraps = Array.isArray(item.nafs_traps)
            ? item.nafs_traps.map(String)
            : Array.isArray(item.nafsTraps)
              ? item.nafsTraps.map(String)
              : [];

          const enriched = enrichTagsAndTraps({
            sourceTitle,
            content,
            tags: rawTags,
            nafsTraps: rawTraps,
            isRibaRelated,
          });

          byId.set(id, {
            id,
            sourceType,
            sourceTitle,
            content,
            tags: enriched.tags,
            nafsTraps: enriched.nafsTraps,
            isRibaRelated,
            youtubeId: item.youtube_id ? String(item.youtube_id) : null,
            startSec:
              typeof item.start_sec === "number" ? item.start_sec : null,
            endSec: typeof item.end_sec === "number" ? item.end_sec : null,
            audioUrl: item.audio_url ? String(item.audio_url) : null,
            createdAt: new Date(Date.now() - idx * 60_000),
          });
        });
      }
    }
  } catch {
    // Continue with CORE_SEED_CHUNKS if file read fails
  }

  cachedCorpus = Array.from(byId.values());
  return cachedCorpus;
}

export interface HybridSearchInput {
  userMessage?: string;
  filterCategory?: string | null;
  filterNafs?: string | null;
  forceRiba?: boolean;
  matchCount?: number;
}

export function scoreChunkRelevance(
  chunk: LocalKnowledgeChunk,
  input: HybridSearchInput,
  keywords: string[]
): number {
  let score = 0.35; // Base semantic score

  if (input.forceRiba && chunk.isRibaRelated) {
    score += 0.45;
    if (
      chunk.tags.includes("BAKARA_275_279") ||
      chunk.sourceTitle.includes("275")
    ) {
      score += 0.25;
    }
  }

  if (
    input.filterCategory &&
    chunk.tags.some(
      (t) => t.toUpperCase() === input.filterCategory?.toUpperCase()
    )
  ) {
    score += 0.3;
  }

  if (
    input.filterNafs &&
    chunk.nafsTraps.some(
      (n) => n.toUpperCase() === input.filterNafs?.toUpperCase()
    )
  ) {
    score += 0.28;
  }

  if (keywords.length > 0) {
    const haystack = `${chunk.sourceTitle} ${chunk.content} ${chunk.tags.join(" ")}`.toLowerCase();
    let matchedCount = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        matchedCount++;
      }
    }
    score += Math.min(0.3, matchedCount * 0.08);
  }

  return Math.min(1.0, Number(score.toFixed(4)));
}

/**
 * Multi-source balanced hybrid search matching `prisma/sql/02_hybrid_search_rpc.sql`:
 * 1. Mandatory Riba package (if `forceRiba === true`, Bakara 275-279 first)
 * 2. Best QURAN passage
 * 3. Best HADITH / SIYER / DUA passage
 * 4. General top-scoring candidates up to `matchCount`
 */
export function searchLocalKnowledgeCorpus(
  input: HybridSearchInput
): Array<LocalKnowledgeChunk & { similarity: number }> {
  const corpus = getLocalKnowledgeCorpus();
  const keywords = extractMeaningfulKeywords(input.userMessage || "");
  const matchCount = input.matchCount ?? 4;
  const forceRiba = Boolean(input.forceRiba);

  const scored = corpus.map((chunk) => ({
    ...chunk,
    similarity: scoreChunkRelevance(chunk, input, keywords),
  }));

  const selected: Array<LocalKnowledgeChunk & { similarity: number }> = [];
  const usedIds = new Set<string>();
  const usedTitles = new Set<string>();

  const isAlreadyUsed = (item: LocalKnowledgeChunk) =>
    usedIds.has(item.id) || usedTitles.has(item.sourceTitle.trim().toLowerCase());

  const pushUnique = (item?: LocalKnowledgeChunk & { similarity: number }) => {
    if (item && !isAlreadyUsed(item)) {
      usedIds.add(item.id);
      usedTitles.add(item.sourceTitle.trim().toLowerCase());
      selected.push(item);
    }
  };

  // 1. Mandatory Riba package (Bakara 275-279 first)
  if (forceRiba) {
    const ribaCandidates = scored
      .filter((c) => c.isRibaRelated)
      .sort((a, b) => {
        const aBakara =
          a.tags.includes("BAKARA_275_279") || a.sourceTitle.includes("275")
            ? 0
            : 1;
        const bBakara =
          b.tags.includes("BAKARA_275_279") || b.sourceTitle.includes("275")
            ? 0
            : 1;
        if (aBakara !== bBakara) return aBakara - bBakara;
        return b.similarity - a.similarity;
      });
    for (const cand of ribaCandidates) {
      if (selected.length >= 2) break;
      pushUnique(cand);
    }
  }

  // 2. Best QURAN passage
  const bestQuran = scored
    .filter((c) => c.sourceType === "QURAN" && !isAlreadyUsed(c))
    .sort((a, b) => b.similarity - a.similarity)[0];
  pushUnique(bestQuran);

  // 3. Best HADITH / SIYER / DUA passage
  const bestHadithSiyer = scored
    .filter(
      (c) =>
        (c.sourceType === "HADITH" ||
          c.sourceType === "SIYER" ||
          c.sourceType === "DUA") &&
        !isAlreadyUsed(c)
    )
    .sort((a, b) => b.similarity - a.similarity)[0];
  pushUnique(bestHadithSiyer);

  // 4. Fill remaining slots with highest-scoring general matches
  const limit = matchCount + (forceRiba ? 2 : 0);
  const remaining = scored
    .filter((c) => !isAlreadyUsed(c))
    .sort((a, b) => b.similarity - a.similarity);

  for (const cand of remaining) {
    if (selected.length >= limit) break;
    pushUnique(cand);
  }

  return selected.slice(0, limit);
}
