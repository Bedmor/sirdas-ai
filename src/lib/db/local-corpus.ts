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
  "adım",
  "adim",
  "ismim",
  "bugün",
  "bugun",
  "yarın",
  "yarin",
  "dün",
  "dun",
  "geçen",
  "gecen",
  "kaldım",
  "kaldim",
  "kaldı",
  "kaldi",
  "oldum",
  "oldu",
  "oluyor",
  "geldi",
  "geldim",
  "gittim",
  "gitti",
  "dedim",
  "dedi",
  "diyor",
  "yaşıyorum",
  "yasiyorum",
  "çalışıyorum",
  "calisiyorum",
  "istiyorum",
  "bilmiyorum",
  "merhaba",
  "merhabalar",
  "selam",
  "selamlar",
  "selamün",
  "selamun",
  "aleyküm",
  "aleykum",
  "günaydın",
  "gunaydin",
  "akşamlar",
  "aksamlar",
  "geceler",
  "nasılsın",
  "nasilsin",
  "nasılsınız",
  "nasilsiniz",
  "naber",
  "memnun",
  "hoşbulduk",
  "hosbulduk",
]);

function stripLightTurkishSuffix(word: string): string {
  // Yalnızca çekim eklerini (hal, iyelik, çoğul, şahıs) soyar; "merhaba"->"merha" veya "yazılımcı"->"yazıl" gibi kök bozan kesmeler yapmaz.
  const stripped = word.replace(
    /(?:lardan|lerden|ların|lerin|ları|leri|ndan|nden|dan|den|tan|ten|nda|nde|da|de|ta|te|nın|nin|nun|nün|ım|im|um|üm|ın|in|un|ün|lar|ler|ya|ye|yı|yi|yu|yü)$/u,
    ""
  );
  return stripped.length >= 4 ? stripped : word;
}

/**
 * Extracts meaningful domain keywords (stems >= 3 chars, excluding stop-words).
 */
export function extractMeaningfulKeywords(text: string, maxWords = 8): string[] {
  if (!text) return [];
  const words = text
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\u0307/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !TURKISH_STOP_WORDS.has(w));

  const unique: string[] = [];
  for (const w of words) {
    const stem = stripLightTurkishSuffix(w);
    if (!unique.includes(w)) unique.push(w);
    if (
      stem.length >= 4 &&
      !TURKISH_STOP_WORDS.has(stem) &&
      !unique.includes(stem)
    ) {
      unique.push(stem);
    }
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
  {
    id: "chunk-hadith-pehlivan",
    sourceType: "HADITH",
    sourceTitle: "Sahih Buhârî (Edeb 76) — Öfke ve Hilm Ahlakı",
    content:
      "Resûlullah (s.a.v.) buyurdu: 'Gerçek pehlivan güreşte rakibini yere seren kimse değildir. Asıl pehlivan, öfkelendiğinde nefsine hakim olabilen kimsedir.'",
    tags: ["OFKE_VE_AHLAK", "hilm", "sabir", "pehlivan", "nefis_terbiyesi"],
    nafsTraps: ["INTIKAM_VE_HASET", "GIZLI_KIBIR_HAKLILIK"],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:07:00Z"),
  },
  {
    id: "chunk-quran-duha",
    sourceType: "QURAN",
    sourceTitle: "Duhâ Suresi 3-5",
    content:
      "Rabbin seni terk etmedi ve sana darılmadı. Muhakkak ki ahiret senin için dünyadan daha hayırlıdır. İleride Rabbin sana öyle nimetler verecek ki sen de hoşnut olacaksın.",
    tags: ["DUHA", "TESKIN_VE_TESELLI", "SABIR_VE_MUSIBET", "DUA_VE_ILCA_USULU"],
    nafsTraps: ["UMITSIZLIK_KARAMSARLIK", "ACELECI_TALEPLER_VE_ISTIACAL"],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:08:00Z"),
  },
  {
    id: "chunk-hadith-tayyib",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Zekât 65) — Helal ve Tayyib Rızık",
    content:
      "Resûlullah (s.a.v.) buyurdu: 'Ey insanlar! Şüphesiz Allah Teâlâ tayyibtir (tertemizdir ve her türlü noksanlıktan münezzehtir), ancak temiz ve helal olanı kabul eder.'",
    tags: ["RIZIK_VE_TICARET", "helal", "tayyib", "infaq", "sadaka"],
    nafsTraps: ["KOLAY_KAZANC_HIRSI", "CIMRILIK_VE_MAL_HIRSI"],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:09:00Z"),
  },
  {
    id: "chunk-quran-bakara-155",
    sourceType: "QURAN",
    sourceTitle: "Bakara Suresi 155-156 — Dünya İmtihan Sırrı",
    content:
      "Andolsun ki sizi biraz korku ve açlıkla; mallardan, canlardan ve ürünlerden eksiltmekle sınayacağız. Sabredenleri müjdele! Onlar ki bir musibete uğradıklarında 'Biz şüphesiz Allah'a aidiz ve muhakkak O'na döneceğiz' derler.",
    tags: ["KADER_VE_KAZA_HIKMETI", "SABIR_VE_MUSIBET", "TESKIN_VE_TESELLI"],
    nafsTraps: ["KADERE_ITIRAZ_VE_ISYAN", "UMITSIZLIK_KARAMSARLIK"],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:10:00Z"),
  },
  {
    id: "chunk-quran-muavvizeteyn",
    sourceType: "QURAN",
    sourceTitle: "Felak ve Nâs Sureleri (Muavvizeteyn)",
    content:
      "De ki: Yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfürenlerin şerrinden ve haset ettiği vakit hasetçinin şerrinden sabahın Rabbine sığınırım... İnsanların kalplerine vesvese sokan sinsi vesvesecinin şerrinden insanların Rabbine, insanların Melik'ine, insanların İlahı'na sığınırım.",
    tags: ["TEVEKKUL_VE_MURAKABE", "DUA_VE_ILCA_USULU", "felak", "nas", "siginma"],
    nafsTraps: ["VESVESE_VE_GUSUL_ABDEST_EVHAMI", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"],
    isRibaRelated: false,
    youtubeId: null,
    startSec: null,
    endSec: null,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:11:00Z"),
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
  if (/taif|uhud|sevr|hicret|tebük|hendek|boykot|hudeybiye|akabe|bedir|ifk|siyer/.test(text)) {
    tags.add("SIYER_ORNEKLERI");
    tags.add("SIYERDE_DARLIK_DONEMLERI");
  }
  if (/vefasızlık|vefasizlik|dışlanma|dislanma|yalnızlık|yalnizlik|tükenmişlik|tukenmislik/.test(text)) {
    tags.add("TESKIN_VE_TESELLI");
    tags.add("SABIR_VE_MUSIBET");
    traps.add("UMITSIZLIK_KARAMSARLIK");
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

  const dataFiles = [
    "thematic_texts.json",
    "hadith_kutub_sitte.json",
    "siyer_kriz_matrisi.json",
    "tefsir_hikmet_corpus.json",
    "akaid_fikhul_ekber_tahavi.json",
    "ihyau_ulumiddin_gazali.json",
    "ezkar_nevevi.json",
  ];

  for (const fileName of dataFiles) {
    try {
      const candidatePaths = [
        path.join(process.cwd(), "src/data/corpus", fileName),
        path.join(process.cwd(), "data-pipeline/data", fileName),
      ];
      let filePath: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }
      if (!filePath) continue;

      const rawJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (!Array.isArray(rawJson)) continue;

      rawJson.forEach((item: Record<string, unknown>, idx: number) => {
        // Normalize source_type
        let sourceType: LocalSourceType = "QURAN";
        const rawSourceType = String(
          item.source_type || item.sourceType || item.category || ""
        )
          .toUpperCase()
          .trim();
        if (
          rawSourceType === "HADITH" ||
          rawSourceType === "SIYER" ||
          rawSourceType === "DUA" ||
          rawSourceType === "QURAN" ||
          rawSourceType === "HALIS_AYDEMIR"
        ) {
          sourceType = rawSourceType as LocalSourceType;
        } else if ("siyer_id" in item || "olay_adi" in item) {
          sourceType = "SIYER";
        } else if ("tefsir_id" in item || "sure" in item) {
          sourceType = "QURAN";
        } else if ("hadis_id" in item || "kaynak" in item) {
          sourceType = "HADITH";
        } else if ("akaid_id" in item || "eser" in item) {
          sourceType = "HADITH";
        } else if ("ihya_id" in item || "kitap_adi" in item) {
          sourceType = "HADITH";
        } else if ("ezkar_id" in item || "dua_turkce" in item) {
          sourceType = "DUA";
        }

        // Normalize source_title
        let sourceTitle = String(
          item.source_title || item.sourceTitle || item.title || ""
        ).trim();
        if (!sourceTitle) {
          if ("akaid_id" in item || "eser" in item) {
            sourceTitle = item.eser ? `${item.eser}: ${item.baslik || "Akaid"}` : "Ehl-i Sünnet Akaid";
          } else if ("ihya_id" in item || "kitap_adi" in item) {
            sourceTitle = `İmam Gazalî - İhyâ: ${item.kitap_adi || item.bolum_adi || "Ahlak"}`;
          } else if ("ezkar_id" in item || "eser_adi" in item) {
            sourceTitle = `İmam Nevevî - ${item.eser_adi || "el-Ezkâr"}: ${item.baslik || "Zikir ve Dua"}`;
          } else if ("siyer_id" in item || "olay_adi" in item) {
            const donemStr = item.donem ? ` (${item.donem})` : "";
            sourceTitle = `Siyer-i Nebî: ${item.olay_adi || "Olay"}${donemStr}`;
          } else if ("tefsir_id" in item || "sure" in item) {
            const ayetStr = item.ayet_no ? ` ${item.ayet_no}` : "";
            sourceTitle = `${item.sure || "Sure"}${ayetStr} - Tefsir ve Hikmet`;
          } else if ("hadis_id" in item || "kaynak" in item) {
            const babStr = item.bab_no ? ` - Bab ${item.bab_no}` : "";
            const bolumStr = item.kitap_bolumu ? ` (${item.kitap_bolumu})` : "";
            sourceTitle = `${item.kaynak || "Hadis"}${bolumStr}${babStr}`;
          } else {
            sourceTitle = `Kaynak-${fileName}-${idx}`;
          }
        }

        // Normalize content
        let content = String(item.content || "").trim();
        if (!content) {
          if ("akaid_id" in item || "eser" in item) {
            const serhPart = item.serh_ve_hikmet ? `\n\nŞerh ve Delil: ${item.serh_ve_hikmet}` : "";
            const hikmetPart = item.manevi_hikmet ? `\n\nManevi Hikmet: ${item.manevi_hikmet}` : "";
            content = `İtikad Esası: "${item.turkce_metin}"${serhPart}${hikmetPart}`;
          } else if ("ihya_id" in item || "kitap_adi" in item) {
            const ozetPart = item.ozet_hikmet ? `\n\nİhyâ Hikmeti: ${item.ozet_hikmet}` : "";
            const dersPart = item.nefis_terbiyesi ? `\n\nNefis Terbiyesi Dersi: ${item.nefis_terbiyesi}` : "";
            content = `Ahlak ve Kalp Ameli: "${item.turkce_metin}"${ozetPart}${dersPart}`;
          } else if ("ezkar_id" in item || "dua_turkce" in item) {
            const kaynakPart = item.kaynak ? ` [Kaynak: ${item.kaynak}]` : "";
            const serhPart = item.serh ? `\n\nŞerh: ${item.serh}` : "";
            const hikmetPart = item.manevi_hikmet ? `\n\nManevi Hikmet: ${item.manevi_hikmet}` : "";
            content = `Dua ve Zikir: "${item.dua_turkce}"${kaynakPart}${serhPart}${hikmetPart}`;
          } else if ("turkce_meal" in item) {
            const kaynakInfo = item.kaynak
              ? ` [Kaynak: ${item.kaynak}, Derece: ${item.sahihlik_derecesi || "Sahih"}]`
              : "";
            const raviPart = item.ravi ? `\n\nRavi: ${item.ravi}` : "";
            const vurudPart = item.sebeb_i_vurud ? `\n\nSebeb-i Vürûd: ${item.sebeb_i_vurud}` : "";
            const serhPart = item.hadis_serhi ? `\n\nHadis Şerhi: ${item.hadis_serhi}` : "";
            const hikmetPart = item.manevi_hikmet ? `\n\nManevi Hikmet: ${item.manevi_hikmet}` : "";
            content = `Resûlullah (s.a.v.) buyurdu: "${item.turkce_meal}"${kaynakInfo}${raviPart}${vurudPart}${serhPart}${hikmetPart}`;
          } else if ("ozet_metin" in item) {
            const hikmetPart = item.manevi_hikmet
              ? `\n\nManevi Hikmet ve Çözüm: ${item.manevi_hikmet}`
              : "";
            content = `${item.ozet_metin}${hikmetPart}`;
          } else if ("ayet_meali" in item) {
            const tefsirPart = item.nuzul_sebebi_ve_tefsir
              ? `\n\nNüzul Sebebi ve Tefsir Hikmeti: ${item.nuzul_sebebi_ve_tefsir}`
              : "";
            const hikmetPart = item.manevi_hikmet
              ? `\n\nManevi Hikmet: ${item.manevi_hikmet}`
              : "";
            content = `Ayet-i Kerime: "${item.ayet_meali}"${tefsirPart}${hikmetPart}`;
          }
        }

        if (!sourceTitle || !content) return;

        const id = String(
          item.id ||
            item.hadis_id ||
            item.siyer_id ||
            item.tefsir_id ||
            item.akaid_id ||
            item.ihya_id ||
            item.ezkar_id ||
            `${fileName}-${idx}`
        );
        const isRibaRelated = Boolean(
          item.is_riba_related ?? item.isRibaRelated ?? false
        );

        const rawTags = Array.isArray(item.tags) ? item.tags.map(String) : [];
        if (Array.isArray(item.kategori_etiketleri)) {
          item.kategori_etiketleri.forEach((k) => rawTags.push(String(k)));
        }
        if (Array.isArray(item.duygu_ve_kriz_etiketleri)) {
          item.duygu_ve_kriz_etiketleri.forEach((d) => rawTags.push(String(d)));
        }

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
    } catch {
      // Continue with remaining files if one fails
    }
  }

  cachedCorpus = Array.from(byId.values());
  return cachedCorpus;
}

export const MIN_LOCAL_RAG_SCORE = 0.42;

export interface HybridSearchInput {
  userMessage?: string;
  filterCategory?: string | null;
  filterNafs?: string | null;
  forceRiba?: boolean;
  matchCount?: number;
  minSimilarity?: number;
  intentMode?: "MANEVI_AYNA" | "ILIM_VE_SIYER";
}

const SPIRITUAL_CONCEPT_BRIDGES: ReadonlyArray<{
  trigger: RegExp;
  targetTerms: ReadonlyArray<string>;
  targetTags: ReadonlyArray<string>;
}> = [
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:öfke[\p{L}]*|sinir[\p{L}]*|kızgın[\p{L}]*|kızdım|çileden|tahammül[\p{L}]*|patlayaca[ğg]ım|hiddet)(?![\p{L}\p{N}])/iu,
    targetTerms: ["öfke", "pehlivan", "hilm", "affet"],
    targetTags: ["OFKE_VE_AHLAK"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:üzgün[\p{L}]*|üzüldüm|ağlıyor[\p{L}]*|ağladım|gözyaş[\p{L}]*|kırgın[\p{L}]*|kırıldım|kalbim\s*kırık|kalbimi\s*kırdı|hüzün[\p{L}]*|içim\s*acıyor|içim\s*yanıyor)(?![\p{L}\p{N}])/iu,
    targetTerms: ["terk etmedi", "zorlukla beraber", "göğsünü", "ferahlık", "teselli"],
    targetTags: ["TESKIN_VE_TESELLI", "SABIR_VE_MUSIBET"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:daral[\p{L}]*|bunal[\p{L}]*|sıkış[\p{L}]*|kaygı[\p{L}]*|anksiyete[\p{L}]*|panik|evham[\p{L}]*|vesvese[\p{L}]*|stres[\p{L}]*|korkuyorum)(?![\p{L}\p{N}])/iu,
    targetTerms: ["inşirah", "ferahlık", "darlık", "kalpler", "kolaylık"],
    targetTags: ["TESKIN_VE_TESELLI", "TEVEKKUL_VE_MURAKABE"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:vefat|kaybettim|cenaze|toprağa\s*verdim|yas\s*tut[\p{L}]*|ölüm)(?![\p{L}\p{N}])/iu,
    targetTerms: ["musibet", "sabır", "ahiret", "ölüm"],
    targetTags: ["FANILIK_VE_TAZIYE", "SABIR_VE_MUSIBET"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:haksızlı[ğg][\p{L}]*|hakkım[\p{L}]*\s*ye[\p{L}]*|kul\s*hakkı|iftira|zulüm|mobbing)(?![\p{L}\p{N}])/iu,
    targetTerms: ["kul hakkı", "adalet", "müflis", "haksızlık"],
    targetTags: ["KUL_HAKKI_VE_ADALET"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:rızık|geçim|işsiz[\p{L}]*|maaş|bereket|fakirlik|borç[\p{L}]*|borcum|iflas)(?![\p{L}\p{N}])/iu,
    targetTerms: ["rızık", "çıkış yolu", "beklemediği yerden", "tevekkül"],
    targetTags: ["RIZIK_VE_TICARET"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:pişman[\p{L}]*|günah[\p{L}]*|tövbe|tevbe|istiğfar|vicdan[\p{L}]*|mahcup[\p{L}]*|affeder\s*mi)(?![\p{L}\p{N}])/iu,
    targetTerms: ["tevbe", "tövbe", "bağışla", "ümidinizi kesmeyin"],
    targetTags: ["TEVBE_VE_INABE"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:yoruldum|yorgunum|tükendim|tükenmiş[\p{L}]*|bitkinim|takatim\s*kalmadı|gücüm\s*kalmadı)(?![\p{L}\p{N}])/iu,
    targetTerms: ["kolaylık", "inşirah", "sabır", "terk etmedi"],
    targetTags: ["TESKIN_VE_TESELLI", "SABIR_VE_MUSIBET"],
  },
  {
    trigger:
      /(?<![\p{L}\p{N}])(?:dışla[\p{L}]*|dışlandım|taşla[\p{L}]*|kimsem\s*yok|terk\s*edildim)(?![\p{L}\p{N}])/iu,
    targetTerms: ["taif", "taşlanma", "siyer", "teslimiyet"],
    targetTags: ["SIYER_ORNEKLERI", "SIYERDE_DARLIK_DONEMLERI", "TESKIN_VE_TESELLI"],
  },
];

function normalizeAsciiToken(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[âā]/g, "a")
    .replace(/[îī]/g, "i")
    .replace(/[ûū]/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

const VALID_TURKISH_INFLECTION_TAILS =
  /^(?:i|u|a|e|im|in|um|un|imiz|iniz|umuz|unuz|lar|ler|lari|leri|dan|den|tan|ten|ndan|nden|da|de|ta|te|nda|nde|nin|nun|in|un|ya|ye|yi|yu|dir|tir|dur|tur|li|lu|lik|luk|siz|suz|di|du|ti|tu|mis|mus|yan|yen|yarak|yerek|yip|yup|nip|nup|nma|nme|nmasi|nmesi|lan|len)$/;

function hasPrefixWordMatch(normalizedTokens: string[], kwNorm: string): boolean {
  if (!kwNorm || kwNorm.length < 3) return false;
  const kwStem =
    kwNorm.length >= 5 ? kwNorm.slice(0, 5) : kwNorm.length >= 4 ? kwNorm.slice(0, 4) : kwNorm;
  return normalizedTokens.some((tok) => {
    if (tok === kwNorm) return true;
    if (tok.startsWith(kwNorm)) {
      const tail = tok.slice(kwNorm.length);
      if (VALID_TURKISH_INFLECTION_TAILS.test(tail)) return true;
    }
    if (kwStem.length >= 4 && tok.startsWith(kwStem)) {
      const tail = tok.slice(kwStem.length);
      if (VALID_TURKISH_INFLECTION_TAILS.test(tail)) return true;
    }
    return false;
  });
}

export function scoreChunkRelevance(
  chunk: LocalKnowledgeChunk,
  input: HybridSearchInput,
  keywords: string[]
): number {
  // Alaka eşiği için taban skor 0.0'dır: gerçek kelime veya manevi kavram örtüşmesi yoksa
  // varsayılan kategori etiketleri tek başına rastgele ayet/hadis çekemez.
  let score = 0.0;

  if (input.forceRiba && chunk.isRibaRelated) {
    score += 0.75;
    if (
      chunk.tags.includes("BAKARA_275_279") ||
      chunk.sourceTitle.includes("275")
    ) {
      score += 0.2;
    }
  }

  const titleAndTagsNorm = normalizeAsciiToken(
    `${chunk.sourceTitle} ${chunk.tags.join(" ")}`
  );
  const titleTokens = titleAndTagsNorm
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const contentNorm = normalizeAsciiToken(chunk.content);
  const contentTokens = contentNorm
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const matchedRoots = new Set<string>();
  let titleHits = 0;
  let contentHits = 0;

  for (const kw of keywords) {
    const kwNorm = normalizeAsciiToken(kw).replace(/[^a-z0-9]/g, "");
    if (kwNorm.length < 3) continue;
    const rootKey = kwNorm.slice(0, 5);
    if (matchedRoots.has(rootKey)) continue;

    if (hasPrefixWordMatch(titleTokens, kwNorm)) {
      matchedRoots.add(rootKey);
      titleHits++;
    } else if (hasPrefixWordMatch(contentTokens, kwNorm)) {
      matchedRoots.add(rootKey);
      contentHits++;
    }
  }

  if (titleHits > 0) {
    score += 0.45 + Math.min(0.3, (titleHits - 1) * 0.18);
  }
  if (contentHits > 0) {
    score +=
      (contentHits === 1 ? 0.26 : 0.46) +
      Math.min(0.24, Math.max(0, contentHits - 2) * 0.12);
  }

  // Duygusal / Manevi kavram köprüsü (kullanıcı doğrudan ayet kelimesini geçirmese de gerçek bir dert anlattığında)
  let conceptScore = 0;
  const rawMsg = input.userMessage || "";
  if (rawMsg) {
    for (const bridge of SPIRITUAL_CONCEPT_BRIDGES) {
      if (!bridge.trigger.test(rawMsg)) continue;
      const tagHit = bridge.targetTags.some((tg) => chunk.tags.includes(tg));
      const termHit = bridge.targetTerms.some(
        (tm) =>
          contentNorm.includes(normalizeAsciiToken(tm)) ||
          titleAndTagsNorm.includes(normalizeAsciiToken(tm))
      );
      if (tagHit && termHit) {
        conceptScore += 0.48;
      } else if (termHit) {
        conceptScore += 0.36;
      } else if (tagHit) {
        conceptScore += 0.26;
      }
    }
  }
  score += conceptScore;

  const hasSubstantiveSignal =
    titleHits > 0 ||
    contentHits > 0 ||
    conceptScore > 0 ||
    Boolean(input.forceRiba && chunk.isRibaRelated);

  // Kategori ve nefis tuzağı puanları yalnızca gerçek kelime/kavram sinyali varsa sıralamayı güçlendirir
  if (hasSubstantiveSignal) {
    if (
      input.filterCategory &&
      chunk.tags.some(
        (t) => t.toUpperCase() === input.filterCategory?.toUpperCase()
      )
    ) {
      score += 0.18;
    }

    if (
      input.filterNafs &&
      chunk.nafsTraps.some(
        (n) => n.toUpperCase() === input.filterNafs?.toUpperCase()
      )
    ) {
      score += 0.14;
    }

    if (input.intentMode === "ILIM_VE_SIYER") {
      if (chunk.sourceType === "SIYER") {
        score += 0.22;
      } else if (chunk.sourceType === "HADITH") {
        score += 0.12;
      }
    }
  }

  return Math.min(1.0, Number(score.toFixed(4)));
}

/**
 * Multi-source balanced hybrid search with strict minimum relevance threshold (`MIN_LOCAL_RAG_SCORE`):
 * Benzerlik / kelime-kavram eşleşmesi eşiğin altındaysa kasadan zorla rastgele ayet çekilmez (`[]` döner).
 */
export function searchLocalKnowledgeCorpus(
  input: HybridSearchInput
): Array<LocalKnowledgeChunk & { similarity: number }> {
  const corpus = getLocalKnowledgeCorpus();
  const keywords = extractMeaningfulKeywords(input.userMessage || "");
  const matchCount = input.matchCount ?? 4;
  const forceRiba = Boolean(input.forceRiba);
  const minSimilarity = input.minSimilarity ?? MIN_LOCAL_RAG_SCORE;

  const scored = corpus
    .map((chunk) => ({
      ...chunk,
      similarity: scoreChunkRelevance(chunk, input, keywords),
    }))
    .filter((c) => (forceRiba && c.isRibaRelated) || c.similarity >= minSimilarity);

  if (scored.length === 0) {
    return [];
  }

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

  // 1.5 If ILIM_VE_SIYER mode, prioritize best Siyer passage first (already >= minSimilarity)
  if (input.intentMode === "ILIM_VE_SIYER") {
    const bestSiyer = scored
      .filter((c) => c.sourceType === "SIYER" && !isAlreadyUsed(c))
      .sort((a, b) => b.similarity - a.similarity)[0];
    pushUnique(bestSiyer);
  }

  // 2. Best QURAN passage (only if >= minSimilarity)
  const bestQuran = scored
    .filter(
      (c) =>
        c.sourceType === "QURAN" &&
        !isAlreadyUsed(c) &&
        (!c.isRibaRelated || forceRiba)
    )
    .sort((a, b) => b.similarity - a.similarity)[0];
  pushUnique(bestQuran);

  // 3. Best HADITH / SIYER / DUA passage (only if >= minSimilarity)
  const bestHadithSiyer = scored
    .filter(
      (c) =>
        (c.sourceType === "HADITH" ||
          c.sourceType === "SIYER" ||
          c.sourceType === "DUA") &&
        !isAlreadyUsed(c) &&
        (!c.isRibaRelated || forceRiba)
    )
    .sort((a, b) => b.similarity - a.similarity)[0];
  pushUnique(bestHadithSiyer);

  // 4. Fill remaining slots with highest-scoring general matches >= minSimilarity
  const limit = matchCount + (forceRiba ? 2 : 0);
  const remaining = scored
    .filter((c) => !isAlreadyUsed(c) && (!c.isRibaRelated || forceRiba))
    .sort((a, b) => b.similarity - a.similarity);

  for (const cand of remaining) {
    if (selected.length >= limit) break;
    pushUnique(cand);
  }

  return selected.slice(0, limit);
}
