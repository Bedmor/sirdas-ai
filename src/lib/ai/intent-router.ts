/**
 * Manevi Pusula — Akıllı Niyet Yönlendirmesi (Intent Routing)
 *
 * Sisteme giren mesajı Gemini'ye göndermeden önce iki ana moda ayırır:
 * 1. Dert / İmtihan / İçsel Hâl -> "MANEVI_AYNA" (Sırdaş / Manevi Ayna Modu - Şefkatli üslup)
 * 2. Siyer / Tarih / İlim Sorusu -> "ILIM_VE_SIYER" (Vakur İlim & Hikmet Modu - Net, ansiklopedik ama ruhu olan berrak dil)
 */

import { JevAnalysisResult, RagCategory } from "./jev-taxonomy";

export type ChatIntentMode = "MANEVI_AYNA" | "ILIM_VE_SIYER";

/**
 * Detects whether the user is sending a polite closing, thank-you, or conversational acknowledgment.
 * Prevents triggering unwanted heavy sermon/RAG injection for simple "teşekkürler" or "peki öyle yapacağım".
 */
export function isConversationalClosingOrThanks(text: string): boolean {
  let clean = (text || "").toLowerCase().trim().replace(/['"`’‘]/g, "");
  // Collapse repeated characters (e.g. "pekkiii" -> "peki", "teşekkürlerrr" -> "teşekkürler")
  clean = clean.replace(/(.)\1+/g, "$1");
  if (!clean || clean.length > 95) return false;
  if (/(\?|neden|nas[ıi]l|kimdir|h[üu]km[üu]|fetva|stres|bunal|kayg[ıi]|bor[çc]|daral|darald[ıi]|t[üu]ken)/i.test(clean)) return false;

  return (
    /(te[şs]ek[üu]r|sa[ğg]\s*ol|eyvalah|allah\s*raz[ıi]\s*olsun|saol)/i.test(clean) ||
    /^(peki|tamam|anlad[ıi]m)\s*(öyle|oyle)?\s*(yap|ed)/i.test(clean) ||
    /^(iyi\s*(geceler|ak[şs]amlar|g[üu]nler)|hadi\s*g[öo]r[üu][şs][üu]r[üu]z|kendine\s*iyi\s*bak)/i.test(clean)
  );
}

export interface IntentRoutingResult {
  mode: ChatIntentMode;
  confidence: number;
  reason: string;
  matchedKeywords: string[];
  suggestedRagCategory?: RagCategory;
}

// 1. Birinci şahıs içsel dert, nefis mücadelesi ve ıstırap kalıpları (MANEVI_AYNA)
const PERSONAL_DISTRESS_PATTERNS: ReadonlyArray<RegExp> = [
  /bunald[ıi]m/i,
  /bunal[ıi]mday[ıi]m/i,
  /i[çc]im\s*(daral|s[ıi]k[ıi]l|yan|ac[ıi])/i,
  /can[ıi]m\s*s[ıi]kk[ıi]n/i,
  /t[üu]kendim/i,
  /[çc]aresizim/i,
  /korkuyorum/i,
  /huzursuzum/i,
  /bor[çc](um|lar[ıi]m|lar[ıi]m[ıi]z)\s*var/i,
  /bor[çc]\s*(bata[ğg][ıi]|y[üu]k[üu]|alt[ıi]nda)/i,
  /para\s*(bulam[ıi]yorum|yetmiyor)/i,
  /ge[çc]inemiyorum/i,
  /iflas\s*ettim/i,
  /nefsim(le|e)?\s*(ba[şs]\s*edemiyorum|yenik|a[ğg][ıi]r)/i,
  /g[üu]nah\s*(i[şs]ledim|k[aâ]r[ıi]m|i[çc]indeyim)/i,
  /t[öo]vbe\s*(etmek\s*istiyorum|edemiyorum)/i,
  /affedil(ir\s*miyim|mek\s*istiyorum)/i,
  /namaz(lar[ıi]m[ıi]|\s*k[ıi]lam[ıi]yorum|\s*k[ıi]lmakta\s*zorlan[ıi]yorum)/i,
  /ibadet\s*(edemiyorum|yapam[ıi]yorum|lezzeti)/i,
  /tembellik\s*(yap[ıi]yorum|ediyorum|var)/i,
  /ertele(me\s*hastal[ıi][ğg][ıi]|yip\s*duruyorum)/i,
  /e[şs]imle\s*(kavga|ge[çc]inem|anla[şs]am)/i,
  /bo[şs]anmak\s*ist/i,
  /ailem\s*beni\s*anlam[ıi]yor/i,
  /yaln[ıi]z[ıi]m/i,
  /yaln[ıi]z\s*hissed/i,
  /terk\s*edildim/i,
  /vefas[ıi]zl[ıi]k\s*g[öo]rd[üu]m/i,
  /vesvese\s*(geliyor|var|bo[ğg]uyor)/i,
  /akl[ıi]ma\s*k[öo]t[üu]\s*[şs]eyler/i,
  /[şs][üu]pheye\s*d[üu][şs]/i,
  /inanc[ıi]m[ıi]\s*kaybet/i,
  /bana\s*dua\s*et/i,
  /bana\s*yol\s*g[öo]ster/i,
  /ak[ıi]l\s*ver/i,
  /ne\s*yapmal[ıi]y[ıi]m/i,
  /nas[ıi]l\s*sabred/i,
  /kalbim\s*(k[ıi]r[ıi]k|ac[ıi]yor|a[ğg]r[ıi]yor)/i,
  /a[ğg]l[ıi]yorum/i,
  /kendimi\s*(su[çc]luyor|k[öo]t[üu]\s*hissed|a[şs]a[ğg][ıi])/i,
];

// 2. Soru ve merak belirteçleri (Tarih, ilim, vaka sorgulama)
const INQUIRY_QUESTION_MARKERS: ReadonlyArray<RegExp> = [
  /neden\s*(oldu|ger[çc]ekle[şs]ti|ya[şs]and[ıi]|yap[ıi]ld[ıi]|emredildi|hicret\s*edildi)/i,
  /ni[çc]in\s*(oldu|ger[çc]ekle[şs]ti|ya[şs]and[ıi]|yap[ıi]ld[ıi])/i,
  /nas[ıi]l\s*(oldu|ger[çc]ekle[şs]ti|cereyan\s*etti|ba[şs]lad[ıi]|bitti|kazan[ıi]ld[ıi])/i,
  /ne\s*zaman\s*(oldu|ger[çc]ekle[şs]ti|ya[şs]and[ıi]|indi|emredildi)/i,
  /nerede\s*(oldu|ger[çc]ekle[şs]ti|ya[şs]and[ıi]|bulunuyor)/i,
  /ne\s*oldu(\s*(\?|$))/i,
  /ne\s*ya[şs]and[ıi](\s*(\?|$))/i,
  /neler\s*ya[şs]and[ıi](\s*(\?|$))/i,
  /kimdir(\s*(\?|$))/i,
  /kimlerdendir(\s*(\?|$))/i,
  /sebebi\s*nedir(\s*(\?|$))/i,
  /sebepleri\s*nelerdir(\s*(\?|$))/i,
  /sonucu\s*nedir(\s*(\?|$))/i,
  /sonu[çc]lar[ıi]\s*nelerdir(\s*(\?|$))/i,
  /hikmeti\s*nedir(\s*(\?|$))/i,
  /n[üu]zul\s*sebebi\s*nedir/i,
  /sebeb-i\s*n[üu]zul/i,
  /hakk[ıi]nda\s*bilgi(\s*ver|\s*alabilir\s*miyim|\s*nedir)?/i,
  /olay[ıi]n[ıi]\s*anlat/i,
  /k[ıi]ssas[ıi]n[ıi]\s*anlat/i,
  /gazvesini\s*anlat/i,
  /sava[şs][ıi]n[ıi]\s*anlat/i,
  /tarih[çc]esi\s*nedir/i,
  /ne\s*demektir(\s*(\?|$))/i,
  /ne\s*anlama\s*gelir(\s*(\?|$))/i,
  /demi[şs]\s*midir/i,
  /b[öo]yle\s*bir\s*hadis/i,
  /kayna[ğg][ıi]n[ıi]\s*ver/i,
  /kayna[ğg][ıi]\s*nedir/i,
  /a[çc][ıi]k\s*ayet\s*var\s*m[ıi]/i,
  /ayet\s*var\s*m[ıi]/i,
  /neden\s*izin\s*veriyor/i,
  /neden\s*g[öo]z\s*yumuyor/i,
  /k[öo]t[üu]l[üu]k\s*problemi/i,
  /teodise/i,
];

// 3. Siyer ve İslam Tarihi Anahtar Kavramları
const SIYER_AND_HISTORY_KEYWORDS: ReadonlyArray<string> = [
  "hicret",
  "uhud",
  "bedir",
  "hendek",
  "taif",
  "hudeybiye",
  "mute",
  "mu'te",
  "tebük",
  "tebuk",
  "huneyn",
  "sevr",
  "hira",
  "akabe",
  "darunnedve",
  "darünnedve",
  "darul erkam",
  "dârülerkam",
  "habeşistan",
  "miraç",
  "mirac",
  "isra",
  "mekke'nin fethi",
  "mekkenin fethi",
  "benî kureyza",
  "beni kureyza",
  "benî kaynuka",
  "benî nadir",
  "hayber",
  "ifk hadisesi",
  "rıdvan biatı",
  "ridvan biati",
  "mescid-i dırar",
  "mescidi dırar",
  "veda hutbesi",
  "veda haccı",
  "kıble değişimi",
  "kıblenin değişmesi",
  "fil vakası",
  "fil hadisesi",
  "hüzün yılı",
  "huzun yili",
  "şi'b-i ebi talib",
  "şibi ebi talib",
  "ashab-ı kehf",
  "ashabi kehf",
  "okçular tepesi",
  "okcular tepesi",
  "sahabe kimdir",
  "sahabi",
  "muhacir",
  "ensar",
  "hulefa-i raşidin",
  "aşere-i mübeşşere",
  "namazın 5 vakit olduğuna",
  "5 vakit",
  "2 vakit kılsam",
  "çalışmayanın dini yoktur",
  "vatan sevgisi imandandır",
  "uydurma hadis",
  "sahte hadis",
  "masum çocuk",
  "kötülük problemi",
  "teodise",
  "musab bin umeyr",
  "musab b. umeyr",
  "mus'ab",
  "musab",
  "umeyr",
  "bilal-i habeşi",
  "bilali habeşi",
  "halid bin velid",
  "ammar bin yasir",
  "selman-ı farisi",
  "selmanı farisi",
  "cafer bin ebi talib",
  "ebu cehil",
  "ebu leheb",
  "ebu süfyan",
  "hz. ebubekir",
  "hz. ömer",
  "hz. osman",
  "hz. ali",
  "hz. hamza",
  "hz. hatice",
  "hz. aişe",
  "hz. fatıma",
];

/**
 * Kullanıcı mesajını analiz ederek niyetini iki ana koldan birine yönlendirir.
 *
 * @param userMessage Temizlenmiş / PII'dan arındırılmış kullanıcı mesajı
 * @param jevResult Önceden çalıştırılmış Jev analiz sonucu (isteğe bağlı)
 */
export function detectChatIntent(
  userMessage: string,
  jevResult?: JevAnalysisResult
): IntentRoutingResult {
  const text = (userMessage || "").trim();
  const lower = text.toLowerCase();
  const cleanLower = lower.replace(/['"`’‘]/g, "");

  // 1. Birinci Şahıs Dert & Istırap Tespiti (MANEVI_AYNA)
  const distressMatches: string[] = [];
  for (const pattern of PERSONAL_DISTRESS_PATTERNS) {
    if (pattern.test(lower) || pattern.test(cleanLower)) {
      distressMatches.push(pattern.source);
    }
  }

  // 2. Siyer / Tarih Soru Kalıpları Tespiti (ILIM_VE_SIYER)
  const questionMatches: string[] = [];
  for (const pattern of INQUIRY_QUESTION_MARKERS) {
    if (pattern.test(lower) || pattern.test(cleanLower)) {
      questionMatches.push(pattern.source);
    }
  }

  // 3. Siyer / Tarih Anahtar Kelimeleri Tespiti
  const matchedSiyerKeywords = SIYER_AND_HISTORY_KEYWORDS.filter((kw) => {
    const cleanKw = kw.replace(/['"`’‘]/g, "");
    return lower.includes(kw) || cleanLower.includes(cleanKw);
  });

  // KURAL A: Kişisel ıstırap veya içsel dert belirteçleri baskınsa -> MANEVI_AYNA
  // Örn: "Uhud'daki okçular gibi dünyaya aldandım, borç batağındayım çok bunaldım"
  // Burada Uhud geçse bile asıl mesele kullanıcının dert ve günah kederidir.
  if (distressMatches.length > 0 && questionMatches.length === 0) {
    return {
      mode: "MANEVI_AYNA",
      confidence: 0.95,
      reason: "Kişisel dert, içsel hâl, borç veya nefs mücadelesi beyanı",
      matchedKeywords: distressMatches,
      suggestedRagCategory: jevResult?.rag_category || "TEVEKKUL_VE_MURAKABE",
    };
  }

  // KURAL B: Siyer/İslam tarihi kavramı + Soru veya Bilgi istemi varsa -> ILIM_VE_SIYER
  // Örn: "Hicret neden oldu?", "Uhud'da ne oldu?", "Bedir savaşının sebepleri nelerdir?"
  const hasSiyerKeyword = matchedSiyerKeywords.length > 0;
  const hasInquiryQuestion = questionMatches.length > 0;

  if (hasSiyerKeyword && (hasInquiryQuestion || lower.endsWith("?"))) {
    return {
      mode: "ILIM_VE_SIYER",
      confidence: 0.96,
      reason: `Siyer ve İslam tarihi sorusu (${matchedSiyerKeywords.join(", ")})`,
      matchedKeywords: [...matchedSiyerKeywords, ...questionMatches],
      suggestedRagCategory: "SIYER_ORNEKLERI",
    };
  }

  // KURAL C: Doğrudan tarihi hadise adı ve soru eki bir arada (örn: "Uhud'da ne oldu")
  if (hasSiyerKeyword) {
    const isDirectHistoryQuery =
      /^(uhud|hicret|bedir|hendek|taif|hudeybiye|sevr|mira[çc]|teb[üu]k|habe[şs]istan)/i.test(
        lower
      ) ||
      matchedSiyerKeywords.some((k) =>
        ["hicret", "uhud", "bedir", "hendek", "hudeybiye", "miraç"].includes(k)
      );

    if (isDirectHistoryQuery && distressMatches.length === 0) {
      return {
        mode: "ILIM_VE_SIYER",
        confidence: 0.9,
        reason: `Doğrudan Siyer hadisesi veya şahsiyeti incelemesi (${matchedSiyerKeywords.join(", ")})`,
        matchedKeywords: matchedSiyerKeywords,
        suggestedRagCategory: "SIYER_ORNEKLERI",
      };
    }
  }

  // KURAL D: Genel bir ilim veya şahsiyet sorusu (Ayet nüzul sebebi, tefsir, sahabe hayatı, kimdir)
  if (
    hasInquiryQuestion &&
    /ayet|sure|hadis|sahabe|sahabi|kimdir|vahiy|k[ıi]ble|namaz\s*ne\s*zaman\s*farz/i.test(lower) &&
    distressMatches.length === 0
  ) {
    return {
      mode: "ILIM_VE_SIYER",
      confidence: 0.88,
      reason: "İslami ilim, şahsiyet veya kavram sorusu",
      matchedKeywords: questionMatches,
      suggestedRagCategory: "SIYER_ORNEKLERI",
    };
  }

  // KURAL E: Eğer her iki grup da yoksa veya genel bir iç dökme ise varsayılan MANEVI_AYNA
  return {
    mode: "MANEVI_AYNA",
    confidence: 0.8,
    reason: "Varsayılan manevi tefekkür ve sükûnet hâli",
    matchedKeywords: distressMatches,
    suggestedRagCategory: jevResult?.rag_category || "TEVEKKUL_VE_MURAKABE",
  };
}
