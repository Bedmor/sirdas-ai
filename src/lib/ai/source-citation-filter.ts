/**
 * Manevi Pusula — "Sadece Kullanılan Kaynağı Göster" Filtresi
 *
 * RAG aramasından dönen aday kaynaklar (QURAN, HADITH, SIYER, DUA, HALIS_AYDEMIR)
 * arasından yalnızca AI'ın ürettiği nihai yanıt metniyle (`replyText`) gerçekten
 * örtüşen, doğrudan iktibas edilen veya açıkça atıf yapılan kaynakları tutar.
 */

export interface FilterableSourceItem {
  id: string;
  sourceType: string;
  sourceTitle: string;
  content?: string;
  audioUrl?: string | null;
}

/**
 * Türkçe ve İslami ıstılah metinlerini şapkalı harf, kesme işareti ve ek farklarından
 * arındırarak karşılaştırma için normalize eder.
 */
export function normalizeForCitationMatch(input: string): string {
  return (input || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[âā]/g, "a")
    .replace(/[îī]/g, "i")
    .replace(/[ûū]/g, "u")
    .replace(/[ê]/g, "e")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/['’`´\-—–]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Her yanıtta doğal olarak geçebilen genel dini/sohbet kelimeleri.
 * Tek başına bu kelimelerin geçmesi bir kaynağın "kullanıldığı" anlamına gelmez.
 */
const GENERIC_DISCOURSE_WORDS = new Set<string>([
  "allah",
  "allahu",
  "teala",
  "cenab",
  "cenabi",
  "hak",
  "hakk",
  "rabb",
  "rabbi",
  "rabbim",
  "rabbimiz",
  "rabbin",
  "peygamber",
  "peygamberimiz",
  "efendimiz",
  "resulullah",
  "rasulullah",
  "nebi",
  "sav",
  "aleyhisselam",
  "radiyallahu",
  "hazreti",
  "insan",
  "insanin",
  "insanlar",
  "kul",
  "kulu",
  "kullar",
  "kalp",
  "kalbi",
  "kalbin",
  "kalpler",
  "gonul",
  "gonlun",
  "dunya",
  "ahiret",
  "hayat",
  "zaman",
  "gun",
  "gece",
  "ayet",
  "ayeti",
  "kerime",
  "sure",
  "suresi",
  "hadis",
  "hadisi",
  "serif",
  "siyer",
  "kaynak",
  "sahih",
  "buyur",
  "buyurdu",
  "buyurur",
  "buyurmustur",
  "ferman",
  "hikmet",
  "manevi",
  "islam",
  "musluman",
  "mumin",
  "iman",
  "rahmet",
  "merhamet",
  "dua",
  "sabir",
  "sukur",
  "tevekkul",
  "imtihan",
  "huzur",
  "sukunet",
  "insirah",
  "ferahlik",
  "itminan",
  "vakar",
  "kardesim",
  "aziz",
  "dostum",
  "olan",
  "olur",
  "oldu",
  "olarak",
  "icin",
  "gibi",
  "kadar",
  "daha",
  "cok",
  "her",
  "bir",
  "bu",
  "su",
  "ve",
  "ile",
  "ise",
  "ama",
  "fakat",
  "ancak",
  "cunku",
  "eger",
  "bile",
  "sadece",
  "yalniz",
  "bazen",
  "simdi",
  "sonra",
  "once",
  "kendi",
  "kendisi",
  "bize",
  "sana",
  "seni",
  "senin",
  "size",
  "sizin",
  "onun",
  "onlar",
  "vardir",
  "yoktur",
  "degil",
  "degildir",
  "suphesiz",
  "muhakkak",
]);

/**
 * Bilinen Kur'an Sure isimleri (normalize edilmiş ASCII karşılıkları ve eş anlamlıları).
 */
const SURAH_SYNONYMS: Record<string, string[]> = {
  fatiha: ["fatiha"],
  bakara: ["bakara"],
  "ali imran": ["ali imran", "al i imran"],
  nisa: ["nisa"],
  maide: ["maide"],
  enam: ["enam", "en am"],
  araf: ["araf", "a raf"],
  enfal: ["enfal"],
  tevbe: ["tevbe", "beraet"],
  yunus: ["yunus"],
  hud: ["hud"],
  yusuf: ["yusuf"],
  rad: ["rad", "ra d"],
  ibrahim: ["ibrahim"],
  hicr: ["hicr"],
  nahl: ["nahl"],
  isra: ["isra", "beni israil"],
  kehf: ["kehf"],
  meryem: ["meryem"],
  taha: ["taha", "ta ha"],
  enbiya: ["enbiya"],
  hac: ["hac", "hacc"],
  muminun: ["muminun", "mu minun"],
  nur: ["nur"],
  furkan: ["furkan"],
  suara: ["suara"],
  neml: ["neml"],
  kasas: ["kasas"],
  ankebut: ["ankebut"],
  rum: ["rum"],
  lokman: ["lokman"],
  secde: ["secde"],
  ahzab: ["ahzab"],
  sebe: ["sebe"],
  fatir: ["fatir"],
  yasin: ["yasin", "ya sin"],
  saffat: ["saffat"],
  sad: ["sad"],
  zumer: ["zumer"],
  mumin: ["mumin", "gafir"],
  fussilet: ["fussilet"],
  sura: ["sura"],
  zuhruf: ["zuhruf"],
  duhan: ["duhan"],
  casiye: ["casiye"],
  ahkaf: ["ahkaf"],
  muhammed: ["muhammed"],
  fetih: ["fetih"],
  hucurat: ["hucurat"],
  kaf: ["kaf"],
  zariyat: ["zariyat"],
  tur: ["tur"],
  necm: ["necm"],
  kamer: ["kamer"],
  rahman: ["rahman"],
  vakia: ["vakia"],
  hadid: ["hadid"],
  mucadele: ["mucadele"],
  hasr: ["hasr"],
  mumtehine: ["mumtehine"],
  saf: ["saf"],
  cuma: ["cuma"],
  munafikun: ["munafikun"],
  tegabun: ["tegabun"],
  talak: ["talak"],
  tahrim: ["tahrim"],
  mulk: ["mulk", "tebareke"],
  kalem: ["kalem"],
  hakka: ["hakka"],
  mearic: ["mearic"],
  nuh: ["nuh"],
  cin: ["cin"],
  muzzemmil: ["muzzemmil"],
  muddessir: ["muddessir"],
  kiyame: ["kiyame"],
  insan: ["insan", "dehr"],
  murselat: ["murselat"],
  nebe: ["nebe", "amme"],
  naziat: ["naziat"],
  abese: ["abese"],
  tekvir: ["tekvir"],
  infitar: ["infitar"],
  mutaffifin: ["mutaffifin"],
  insikak: ["insikak"],
  buruc: ["buruc"],
  tarik: ["tarik"],
  ala: ["ala", "a la"],
  gasiye: ["gasiye"],
  fecr: ["fecr"],
  beled: ["beled"],
  sems: ["sems"],
  leyl: ["leyl"],
  duha: ["duha"],
  insirah: ["insirah", "serh"],
  tin: ["tin"],
  alak: ["alak"],
  kadir: ["kadir"],
  beyyine: ["beyyine"],
  zilzal: ["zilzal"],
  adiyat: ["adiyat"],
  karia: ["karia"],
  tekasur: ["tekasur"],
  asr: ["asr"],
  humeze: ["humeze"],
  fil: ["fil"],
  kureys: ["kureys"],
  maun: ["maun"],
  kevser: ["kevser"],
  kafirun: ["kafirun"],
  nasr: ["nasr"],
  tebbet: ["tebbet", "mesed"],
  ihlas: ["ihlas"],
  felak: ["felak"],
  nas: ["nas"],
};

/**
 * Siyer kaynak başlıklarındaki özgül tarihi vakıa / mekan isimleri.
 */
const SIYER_SPECIFIC_ANCHORS: ReadonlyArray<string> = [
  "taif",
  "uhud",
  "bedir",
  "hendek",
  "ahzab",
  "hudeybiye",
  "hicret",
  "sevr",
  "boykot",
  "ebi talib",
  "huzun yili",
  "ifk",
  "tebuk",
  "huneyn",
  "mute",
  "akabe",
  "hayber",
  "habesistan",
  "veda hutbesi",
  "mekke nin fethi",
  "biri maune",
  "reci",
];

function containsWholePhrase(haystackNorm: string, phraseNorm: string): boolean {
  if (!phraseNorm) return false;
  const paddedHaystack = ` ${haystackNorm} `;
  return paddedHaystack.includes(` ${phraseNorm} `);
}

function extractVerseNumbers(titleNorm: string): string[] {
  const nums = titleNorm.match(/\b\d{1,3}\b/g);
  if (!nums) return [];
  const result = new Set<string>(nums);
  // Aralık varsa (ör. 275 279 veya 2 3 veya 5 6) uç sayıları zaten içerir
  return Array.from(result);
}

/**
 * Chunk içeriğindeki tefsir/şerh açıklamalarından ziyade doğrudan ayet mealini,
 * hadis metnini veya dua cümlesini ayıklar.
 */
function extractPrimaryQuoteSegment(rawContent: string): string {
  if (!rawContent) return "";
  const firstBlock = rawContent
    .split(/\n\n(?:Nüzul Sebebi|Şerh|İhyâ Hikmeti|Manevi Hikmet|Nefis Terbiyesi)/i)[0]
    .trim();

  const quotedMatches = firstBlock.match(/["“'‘]([^"”'’]{18,})["”'’]/);
  if (quotedMatches?.[1]) {
    return quotedMatches[1];
  }
  return firstBlock;
}

function extractDistinctiveStems(normText: string): string[] {
  if (!normText) return [];
  const words = normText
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !GENERIC_DISCOURSE_WORDS.has(w) && !/^\d+$/.test(w));

  const stems: string[] = [];
  for (const w of words) {
    const stem = w.length >= 6 ? w.slice(0, 5) : w;
    if (!GENERIC_DISCOURSE_WORDS.has(stem) && !stems.includes(stem)) {
      stems.push(stem);
    }
  }
  return stems;
}

function hasConsecutivePhraseOverlap(
  quoteNorm: string,
  replyNorm: string
): boolean {
  const quoteWords = quoteNorm
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^(bir|ve|ile|bu|su|o|da|de|ki|mi|mu)$/.test(w));

  if (quoteWords.length < 3) return false;

  const replyWords = replyNorm
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^(bir|ve|ile|bu|su|o|da|de|ki|mi|mu)$/.test(w));

  if (replyWords.length < 3) return false;

  const replyTrigrams = new Set<string>();
  for (let i = 0; i <= replyWords.length - 3; i++) {
    // 5 harfli kök bazlı trigram ile Türkçe çekim eklerini tolere et
    const t = [
      replyWords[i].slice(0, 5),
      replyWords[i + 1].slice(0, 5),
      replyWords[i + 2].slice(0, 5),
    ].join(" ");
    replyTrigrams.add(t);
  }

  for (let i = 0; i <= quoteWords.length - 3; i++) {
    const w1 = quoteWords[i];
    const w2 = quoteWords[i + 1];
    const w3 = quoteWords[i + 2];
    // Üç kelimenin tamamı genel söylem kelimesiyse atla
    if (
      GENERIC_DISCOURSE_WORDS.has(w1) &&
      GENERIC_DISCOURSE_WORDS.has(w2) &&
      GENERIC_DISCOURSE_WORDS.has(w3)
    ) {
      continue;
    }
    const qTrigram = [w1.slice(0, 5), w2.slice(0, 5), w3.slice(0, 5)].join(" ");
    if (replyTrigrams.has(qTrigram)) {
      return true;
    }
  }

  return false;
}

/**
 * Tek bir RAG kaynağının, AI tarafından üretilen `replyText` içinde gerçekten
 * atıf yapılarak veya mealen/lafzen iktibas edilerek kullanılıp kullanılmadığını denetler.
 */
export function isSourceUsedInReply(
  source: FilterableSourceItem,
  replyText: string
): boolean {
  if (!source || !replyText || replyText.trim().length < 15) {
    return false;
  }

  // Sentetik kalkan rozetlerini gösterme
  if (source.id === "guardrail-boundary") {
    return false;
  }

  const titleNorm = normalizeForCitationMatch(source.sourceTitle || "");
  const replyNorm = normalizeForCitationMatch(replyText);
  const primaryQuote = extractPrimaryQuoteSegment(source.content || "");
  const quoteNorm = normalizeForCitationMatch(primaryQuote);

  const quoteStems = extractDistinctiveStems(quoteNorm);
  const replyStemSet = new Set(extractDistinctiveStems(replyNorm));
  const matchedStems = quoteStems.filter((s) => replyStemSet.has(s));

  // 1. Doğrudan 3 kelimelik özgün ibare (trigram) iktibası varsa kesin kullanılmıştır
  if (quoteNorm && hasConsecutivePhraseOverlap(quoteNorm, replyNorm)) {
    return true;
  }

  // 2. Kur'an Suresi + Ayet Numarası (veya meal kökü) eşleşmesi
  for (const [, variants] of Object.entries(SURAH_SYNONYMS)) {
    const titleHasSurah = variants.some((v) => containsWholePhrase(titleNorm, v));
    if (!titleHasSurah) continue;

    const replyHasSurah = variants.some((v) => containsWholePhrase(replyNorm, v));
    if (replyHasSurah) {
      const verseNums = extractVerseNumbers(titleNorm);
      if (verseNums.length === 0) {
        return true;
      }
      const replyHasVerseNum = verseNums.some((num) =>
        containsWholePhrase(replyNorm, num)
      );
      if (replyHasVerseNum || matchedStems.length >= 2) {
        return true;
      }
    }
  }

  // 3. Hadis Bab / Numara Atfı (ör. "Buhârî (Edeb 76)" -> yanıtta "edeb 76" geçmesi)
  const hadithSubRefMatch = (source.sourceTitle || "").match(
    /\(([^)]+?)\s+(\d{1,4})\)/
  );
  if (hadithSubRefMatch) {
    const babNorm = normalizeForCitationMatch(hadithSubRefMatch[1]);
    const hadithNum = hadithSubRefMatch[2];
    if (
      babNorm &&
      containsWholePhrase(replyNorm, babNorm) &&
      containsWholePhrase(replyNorm, hadithNum)
    ) {
      return true;
    }
  }

  // 4. Siyer Özgül Vakıa Eşleşmesi (ör. "Taif", "Uhud", "Şi'b-i Ebi Talib", "Hicret")
  if (source.sourceType === "SIYER") {
    for (const anchor of SIYER_SPECIFIC_ANCHORS) {
      if (
        containsWholePhrase(titleNorm, anchor) &&
        containsWholePhrase(replyNorm, anchor)
      ) {
        return true;
      }
    }
  }

  // 5. Meal / Metin Kök Örtüşmesi:
  // Kaynağın öz metnindeki ayırt edici (genel olmayan) kelimelerden en az 3'ü
  // (veya kısa veciz metinlerde en az 2 tanesi ve >= %50 oranında) yanıtta yer alıyorsa
  if (matchedStems.length >= 3) {
    return true;
  }
  if (
    quoteStems.length >= 2 &&
    quoteStems.length <= 4 &&
    matchedStems.length >= 2 &&
    matchedStems.length / quoteStems.length >= 0.5
  ) {
    return true;
  }

  return false;
}

/**
 * Aday RAG kaynak listesini filtreleyerek yalnızca `replyText` içinde gerçekten
 * kullanılan / örtüşen kaynakları döndürür. Hiçbiri kullanılmadıysa `[]` döner.
 */
export function filterUsedSourcesByReply<T extends FilterableSourceItem>(
  sources: ReadonlyArray<T> | null | undefined,
  replyText: string
): T[] {
  if (!Array.isArray(sources) || sources.length === 0 || !replyText) {
    return [];
  }
  return sources.filter((src) => isSourceUsedInReply(src, replyText));
}
