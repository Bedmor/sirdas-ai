/**
 * Manevi Pusula — Deterministik Güvenlik Ön Süzgeci (Safety Triage)
 *
 * Kullanıcı mesajı yapay zekâ modeline gitmeden ÖNCE çalışır. Modelden bağımsız,
 * saf (yan etkisiz) fonksiyonlardan oluşur; ağ, veritabanı veya ortam değişkeni kullanmaz.
 *
 * Öncelik sırası:
 *  1. Kriz / kendine zarar / intihar            -> sabit şefkatli yanıt + 112 & ALO 183 (model atlanır)
 *  2. Şiddet / istismar mağduriyeti             -> sabit yanıt + 112 & ALO 183 (model atlanır)
 *  3. Başkasına ağır zarar verme niyeti          -> sabit yanıt + 112 (model atlanır)
 *  4. Küçük çocuk yaşı + sağlık belirtisi        -> yetişkine + doktora yönlendirme (model atlanır)
 *  5. Ağır fiziksel belirti                      -> önce 112 / doktor (model atlanır)
 *  6. Küçük çocuk yaşı beyanı (12 altı)          -> ebeveyne / yetişkine yönlendirme (model atlanır)
 *  7. Hafif fiziksel belirti                     -> önce doktor (model atlanır; ibadet sorusu
 *                                                   içeriyorsa yalnızca uyarı kutusu + dipnot)
 *  8. Fetva sınırı                               -> model çalışır, hüküm vermez; ALO 190 kutusu + dipnot
 */

export type SafetyCategory =
  | "CRISIS_SELF_HARM"
  | "ABUSE_VICTIM"
  | "HARM_TO_OTHERS"
  | "CHILD_WITH_HEALTH"
  | "PHYSICAL_HEALTH_SEVERE"
  | "CHILD_AGE"
  | "PHYSICAL_HEALTH"
  | "FATWA_LIMIT";

export type SafetyNoticeKind = "crisis" | "health" | "child" | "fatwa";

export interface SafetyHotline {
  number: string;
  label: string;
  description: string;
}

export interface SafetyNotice {
  kind: SafetyNoticeKind;
  title: string;
  message: string;
  hotlines: SafetyHotline[];
}

export interface SafetyTriageResult {
  category: SafetyCategory;
  ruleId: string;
  /** true ise model çağrılmaz, `replyText` aynen gösterilir. */
  bypassModel: boolean;
  status: "crisis_redirected" | "fatwa_blocked" | "processed";
  /** Model atlanıyorsa gösterilecek sabit yanıt; aksi halde null. */
  replyText: string | null;
  /** Model çalışıyorsa yanıtın sonuna eklenecek güvenlik dipnotu (gerekirse). */
  footnote: string | null;
  /** Sohbet ekranında görünecek uyarı kutusu. */
  notice: SafetyNotice;
}

// ---------------------------------------------------------------------------
// Acil hatlar
// ---------------------------------------------------------------------------

export const HOTLINE_112: SafetyHotline = {
  number: "112",
  label: "112 Acil Çağrı",
  description: "Can güvenliği ve sağlık acili, 7/24 ücretsiz",
};

export const HOTLINE_183: SafetyHotline = {
  number: "183",
  label: "ALO 183 Sosyal Destek",
  description: "Aile, kadın, çocuk ve sosyal destek hattı",
};

export const HOTLINE_182: SafetyHotline = {
  number: "182",
  label: "182 MHRS",
  description: "Doktor randevusu",
};

export const HOTLINE_190: SafetyHotline = {
  number: "190",
  label: "ALO 190 Diyanet",
  description: "Diyanet İşleri Başkanlığı dini danışma hattı",
};

// ---------------------------------------------------------------------------
// Metin normalleştirme (Türkçe harf ve yazım varyasyonlarına dayanıklılık)
// ---------------------------------------------------------------------------

const TURKISH_FOLD: Record<string, string> = {
  ı: "i",
  i: "i",
  ş: "s",
  ğ: "g",
  ü: "u",
  ö: "o",
  ç: "c",
  â: "a",
  î: "i",
  û: "u",
};

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/**
 * Türkçe metni karşılaştırma için sadeleştirir:
 * küçük harf (tr-TR), ı/ş/ğ/ü/ö/ç -> i/s/g/u/o/c, şapkalı harfler, birleştirici işaretler,
 * kelime içi nokta/tire, kesme işaretleri ve fazla boşluklar.
 */
export function foldTurkish(input: string): string {
  const lowered = (input || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC");

  let out = "";
  for (const ch of lowered) {
    out += TURKISH_FOLD[ch] ?? ch;
  }

  return out
    .replace(/[’‘'`´"“”]/g, "")
    .replace(/(?<=\p{L})[.\-_*·]+(?=\p{L})/gu, "")
    .replace(/[^\p{L}\p{N}@$\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bir mesajın süzgeçte denenecek tüm biçimlerini üretir:
 *  - sade: Türkçe katlanmış metin
 *  - leet: harflere bitişik rakam/simgeler harfe çevrilmiş ("0lmek 1st1yorum")
 *  - sıkıştırılmış: tekrar eden harfler teke indirilmiş ("ölmeeek", "intiharrr")
 */
export function buildMatchVariants(input: string): string[] {
  const plain = foldTurkish(input);
  const leet = plain.replace(
    /[013457@$]/g,
    (ch, offset: number, whole: string) => {
      const prev = whole[offset - 1] || "";
      const next = whole[offset + 1] || "";
      const touchesLetter = /\p{L}/u.test(prev) || /\p{L}/u.test(next);
      return touchesLetter ? LEET_MAP[ch] ?? ch : ch;
    }
  );
  const squeezedPlain = plain.replace(/(\p{L})\1+/gu, "$1");
  const squeezedLeet = leet.replace(/(\p{L})\1+/gu, "$1");
  return Array.from(new Set([plain, leet, squeezedPlain, squeezedLeet]));
}

function matchesAny(
  variants: ReadonlyArray<string>,
  patterns: ReadonlyArray<RegExp>
): boolean {
  return patterns.some((p) => variants.some((v) => p.test(v)));
}

// ---------------------------------------------------------------------------
// Desenler (katlanmış metin üzerinde: ı->i, ş->s, ğ->g, ü->u, ö->o, ç->c)
// ---------------------------------------------------------------------------

const SELF_HARM_PATTERNS: ReadonlyArray<RegExp> = [
  /intihar/,
  /\bolmek\s*(istiyorum|istiyor|isterdim|istedim|istiyom|geliyor|icin\s*plan|niyet)/,
  /\bolmeyi\s*(dus|ist|plan|kur)/,
  /\bolesim\s*(var|geliyor)/,
  /\bolsem\s*(de|da)?\s*(kurtulsam|bitse|rahatlasam|kurtulurum|daha\s*iyi)/,
  /\bkeske\s*(hic\s*)?(olsem|dogmasaydim)/,
  /yasamak\s*(istemiyorum|istemiyor|gelmiyor|anlamsiz)/,
  /yasamaktan\s*(bikt|usand|yorul|sogu|tuken)/,
  /yasama(min|nin)\s*(hic\s*)?(anlami|manasi)\s*(yok|kalmadi)/,
  /yasamayi\s*(birak|sonlandir)/,
  /(hayatima|yasamima|canima)\s*son\s*ver/,
  /canima\s*kiy/,
  /canimi\s*al(mak|maya|acagim)/,
  /kendimi\s*(oldur|as(ac|mak|may|iyorum)|kes(ec|mek|iyorum|tim)|vur(ac|mak)|yok\s*et|zehirle|kopruden|bina|camdan|asagi\s*at|at(ac|mak)\s*(kopru|bina|camdan|asagi))/,
  /kendime\s*zarar\s*ver/,
  /kendimi\s*yaral(iyorum|adim|ayacagim|amak\s*ist)/,
  /bilek(lerimi|imi)\s*kes/,
  /her\s*seyi\s*bitir(mek|meyi)\s*(istiyorum|dusunuyorum|karar)/,
  /(artik|bu\s*gece)\s*her\s*seyi\s*bitirecegim/,
  /\byok\s*olmak\s*istiyorum/,
  /bir\s*daha\s*uyanmak\s*istemiyorum/,
  /\bhic\s*uyanmasam\b/,
  /\bkill\s*myself\b|\bsuicid/,
];

const ABUSE_VICTIM_PATTERNS: ReadonlyArray<RegExp> = [
  /\bbeni\s*(dov|doverek|dovdu|dovuyor|doverler|dovecek|darp|tokatl|yumrukl|tekmel|bogaz|bogmaya|kilitl|hapsed)/,
  /\bbana\s*(vur|el\s*kaldir|siddet|tecavuz|saldir|tokat)/,
  /siddet\s*(goruyorum|gordum|uyguluyor|uyguladi|ugruyorum|ugradim|ugruyoruz|goruyoruz)/,
  /siddete\s*(ugr|maruz)/,
  /(taciz|istismar|tecavuz)(e|a)?\s*(ugr|maruz)/,
  /\bbeni\s*(taciz|istismar)/,
  /\b(taciz|istismar|tecavuz)\s*(ediyor|etti|ediliyorum|edildim|ediyorlar|ettiler)/,
  /\bbeni\s*oldur(ecek|mekle|meye|ecegini)/,
  /\bbeni\s*olumle\s*tehdit/,
  /\b(ensest|cinsel\s*istismar)\b/,
];

const HARM_TO_OTHERS_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(onu|onlari|birini|esimi|kocami|karimi|babami|annemi|kardesimi|patronumu|komsumu|hepsini|seni)\s*(oldur(ecegim|mek\s*ist|meyi\s*dus|esim\s*geliyor)|bogaz(layacagim|lamak\s*ist))/,
  /\bolduresim\s*geliyor/,
  /\b(oldurecegim|olduruecegim)\b/,
  /\b(silahla|bicakla)\s*(vuracagim|saldiracagim|oldurecegim)/,
];

// Ağır fiziksel belirtiler: her durumda önce 112 / acil sağlık.
const SEVERE_HEALTH_PATTERNS: ReadonlyArray<RegExp> = [
  /gogs?(um|u|us)?\s*(cok\s*|bir\s*anda\s*|surekli\s*)?(agri|sikis|sikiliyor|yaniyor|batiyor|baski)/,
  /gogus\s*agrisi/,
  /\bnefes\s*(alam|alamiyor|almakta\s*zorlan|almak\s*zor|darlig|daral|tikan)/,
  /\bnefesim\s*(daral|kesil|yetmiyor|tikan)/,
  /\bnefessiz\s*kal/,
  /\b(bayildim|bayiliyorum|bayilacak\s*gibi|bayilma|bilincimi\s*kaybet|bilinc\s*kaybi|kendimden\s*geciyorum)/,
  /\bkalp\s*(krizi|krizi\s*geciriyor)/,
  /\b(kalbim|kalp)\s*(cok\s*)?(hizli\s*carpiyor|duracak\s*gibi|tekliyor)/,
  /\bcarpinti/,
  /\bkan\s*(kusuyorum|kustum|tukuruyorum)/,
  /(cok|siddetli|durmayan|durmuyor|durduramiyorum)\s*(\p{L}+\s*)?(kanama|kaniyor)/u,
  /kanama\s*(durmuyor|durmadi|cok\s*fazla)/,
  /\b(felc|inme\s*indi|yuzum\s*kaydi|kolum\s*tutmuyor|konusamiyorum\s*birden)/,
  /\b(havale\s*geciriyor|nobet\s*geciriyor|kasilma\s*nobeti)/,
  /\b(zehirlendim|zehirlenme|ilac\s*icip\s*fazla|asiri\s*doz)/,
];

// Hafif / genel fiziksel belirtiler: önce doktora yönlendir.
const MILD_HEALTH_PATTERNS: ReadonlyArray<RegExp> = [
  /\bbas(im|i|imiz)?\s*(cok\s*|biraz\s*|hala\s*|surekli\s*|deli\s*gibi\s*)?(agri|zonkl|donuyor|donmesi|catliyor)/,
  /\bbas\s*agrisi/,
  /\bkafa(m|mi)?\s*(cok\s*|biraz\s*|hala\s*)?(agri|zonkl|catliyor)/,
  /\bbas\s*donmesi/,
  /\b(karn|mide|dis|bel|sirt|kulag|kulak|goz|bogaz|bacag|bacak|kol|eklem|bobreg|bobrek|boyn|boyun|dizim|diz)\p{L}*\s*(cok\s*|biraz\s*|hala\s*|surekli\s*)?(agri|sanci|sizliyor|zonkl|yaniyor)/u,
  /\b(atesim|atesi|atesimiz)\s*(var|cikti|yuksel|dusmuyor|\d)/,
  /\b(ateslendim|ateslendi|yuksek\s*ates|ates\s*olc)/,
  /\bbulanti|\bmidem\s*bulan|\bmide\s*bulantisi/,
  /\b(kusuyorum|kustum|kusma|kusacak\s*gibi)/,
  /\b(burnum|disetim|yaram)\s*(kaniyor|kanadi)|\bkanamam\s*var|\bkan\s*geliyor/,
  /\b(ishal|kabizlik)\s*(oldum|var)/,
  /\b(hastayim|hastalandim|grip\s*oldum|nezle\s*oldum)\b/,
];

// İbadet sıhhati bağlamı: bu varsa hafif belirti tek başına modeli kilitlemez
// (mevcut ilmihal kalkanı fıkhi soruyu yanıtlar, kutu + dipnot sağlık uyarısını taşır).
const WORSHIP_CONTEXT_PATTERN =
  /\b(abdest|gusul|gusl|namaz|oruc|teyemmum|taharet|rekat|secde|hayiz|lohusa|ozur\s*sahibi|istihaze|kaza\s*namaz)/;

const FATWA_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(helal|haram|caiz|gunah|mubah|mekruh|farz|vacip|sevap)\s*(mi|mu|midir|mudur|olur\s*mu|sayilir\s*mi)\b/,
  /\bhelal\s*mi\s*haram\s*mi/,
  /\bfetva/,
  /\b(dini|seri|fikhi)\s*hukmu/,
  /\bhukmu\s*(nedir|ne)\b/,
  /\bdinen\s*(uygun\s*mu|caiz|sakincasi|bir\s*sakinca|gecerli\s*mi|dogru\s*mu)/,
  /\b(talak|talag)/,
  /\bbos\s*ol\b|\bbosol\b|\bseni\s*bosuyorum|\bbosuyorum\b/,
  /\bbosand(ik|im|iniz|ilar)?\s*m(i|iyiz|iyim)/,
  /\bbosanmis\s*sayilir/,
  /\b(uc|3)\s*(kere|kez|defa)\s*bos/,
  /\bnikah(im|imiz)?\s*(dustu|bozuldu|gecerli|duser|bozulur)/,
  /\bmiras(tan|ta|in|im)?\s*(pay|hisse|nasil\s*bol|paylas|kime|ne\s*kadar|hesab)/,
  /\bmirasta\s*(kiz|erkek|es)/,
  /\bmiras\p{L}*\b.*\b(pay|hisse)\p{L}*/u,
  /\b(kiz|erkek)\s*(cocuga|kardese)\s*(dusen|ne\s*kadar)\s*(pay|miras)/,
];

// Bariz kurgu / mizah işaretleri: fetva kutusunu bastırır (mizah cevabı modele bırakılır).
const FICTION_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(ejderha|ejder|uzayli|zaman\s*makinesi|mars\s*ta|marsta|mars\s*koloni|phobos|deimos|unicorn|tek\s*boynuzlu|zombi|vampir|hobbit|buyucu\s*okulu|hogwarts|dinozor)/,
];

// ---------------------------------------------------------------------------
// Yaş beyanı
// ---------------------------------------------------------------------------

const WORD_AGES: Record<string, number> = {
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  "on bir": 11,
  onbir: 11,
};

const TENS_WORDS = new Set([
  "on",
  "yirmi",
  "otuz",
  "kirk",
  "elli",
  "altmis",
  "yetmis",
  "seksen",
  "doksan",
  "yuz",
]);

const AGE_TOKEN = "(\\d{1,3}|on\\s*bir|onbir|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on)";

const FIRST_PERSON_AGE_PATTERNS: ReadonlyArray<RegExp> = [
  new RegExp(`(?:^|\\s)${AGE_TOKEN}\\s*yas(?:in)?da(?:yim|yiz)\\b`),
  new RegExp(`(?:^|\\s)${AGE_TOKEN}\\s*yasinda\\s*(?:bir\\s*)?(?:cocugum|cocuk\\s*olarak|kizim|ogl?anim|bebegim)\\b`),
  new RegExp(`\\byasim\\s*${AGE_TOKEN}\\b`),
  new RegExp(`\\bben\\s*${AGE_TOKEN}\\s*yasinda(?:yim)?\\b`),
];

function parseAgeToken(token: string): number | null {
  const t = token.replace(/\s+/g, " ").trim();
  if (/^\d+$/.test(t)) return Number(t);
  if (t in WORD_AGES) return WORD_AGES[t];
  const compact = t.replace(/\s/g, "");
  if (compact in WORD_AGES) return WORD_AGES[compact];
  return null;
}

/** Kullanıcının kendisi için beyan ettiği yaşı döndürür (yoksa null). */
export function detectDeclaredAge(input: string): number | null {
  const text = foldTurkish(input);
  for (const pattern of FIRST_PERSON_AGE_PATTERNS) {
    const m = text.match(pattern);
    if (m && m[1]) {
      // "on sekiz", "yirmi iki" gibi bileşik sayılarda son kelimeyi tek başına yaş sanma
      const before = text.slice(0, (m.index ?? 0) + m[0].indexOf(m[1])).trim();
      const prevWord = before.split(" ").pop() || "";
      if (/^\p{L}+$/u.test(m[1]) && TENS_WORDS.has(prevWord)) continue;
      const age = parseAgeToken(m[1]);
      if (age !== null && age >= 0 && age <= 120) return age;
    }
  }
  return null;
}

export const CHILD_AGE_LIMIT = 12;

// ---------------------------------------------------------------------------
// Sabit yanıt metinleri
// ---------------------------------------------------------------------------

export const SAFETY_REPLIES = {
  crisis:
    "Bunu paylaştığınız için teşekkür ederim. Şu an taşıdığınız yük çok ağır olabilir; bununla tek başınıza kalmak zorunda değilsiniz.\n\n" +
    "Canınız çok kıymetli. Lütfen hemen şimdi bir insandan destek alın:\n\n" +
    "• **112 Acil Çağrı Merkezi**: Kendinize zarar verme tehlikesi varsa ya da şu an güvende değilseniz hemen arayın (7/24, ücretsiz).\n" +
    "• **ALO 183 Sosyal Destek Hattı**: Konuşabileceğiniz ve yönlendirme alabileceğiniz destek hattı.\n\n" +
    "Mümkünse güvendiğiniz bir yakınınıza şimdi haber verin ve yalnız kalmayın. Ben bir yapay zekâyım; bu anda size gereken desteği bir insan ve bir uzman verebilir. Hazır olduğunuzda burada sizi dinlemeye devam ederim.",
  abuse:
    "Yaşadıklarınızı anlattığınız için teşekkür ederim. Size yapılan şey kabul edilemez ve bunun suçu sizde değil. Hiç kimsenin size şiddet uygulamaya ya da zarar vermeye hakkı yoktur.\n\n" +
    "• **112 Acil Çağrı Merkezi**: Şu an tehlikedeyseniz ya da şiddet sürüyorsa hemen arayın.\n" +
    "• **ALO 183 Sosyal Destek Hattı**: Kadın, çocuk ve aile için destek ve yönlendirme hattı.\n" +
    "• Telefonunuzda **KADES** uygulaması varsa acil yardım düğmesini kullanabilirsiniz.\n\n" +
    "Mümkünse güvenli bir yere geçin ve güvendiğiniz bir yakınınıza haber verin. Güvende olduğunuzda burada sizi dinlemeye hazırım.",
  harmToOthers:
    "İçinizdeki öfkenin ne kadar büyük olduğunu görüyorum. Ama kimseye zarar vermeden önce lütfen durun: Bu düşünce hem sizin hem de başkalarının hayatını geri dönülmez biçimde değiştirebilir.\n\n" +
    "• Kendinizi tutamayacağınızı ya da birinin tehlikede olduğunu hissediyorsanız hemen **112**'yi arayın.\n" +
    "• Bulunduğunuz ortamdan bir süre uzaklaşın, derin nefes alın ve güvendiğiniz biriyle konuşun.\n" +
    "• Öfkeyle baş etmek için **ALO 183** üzerinden destek ve yönlendirme alabilirsiniz.\n\n" +
    "Sakinleştiğinizde, sizi bu noktaya getiren şeyi burada birlikte konuşabiliriz.",
  childWithHealth:
    "Merhaba küçük dostum. Başın ya da bir yerin ağrıyorsa bunu hemen annene, babana veya yanındaki bir büyüğüne söyle. Onlar seni bir doktora götürebilir.\n\n" +
    "Çok kötü hissediyorsan, nefes almakta zorlanıyorsan ya da yanında hiç büyük yoksa, bir büyükle birlikte **112**'yi arayın.\n\n" +
    "_(Bu mesajı bir yetişkin yazdıysa: Çocuğun belirtileri için lütfen bir doktora başvurun; acil bir durumda 112'yi arayın.)_",
  severeHealth:
    "Anlattığınız belirtiler acil olabilir. Lütfen beklemeyin ve hemen **112 Acil Çağrı Merkezi**'ni arayın ya da en yakın acil servise gidin.\n\n" +
    "Yanınızda biri varsa ona da haber verin. Bu durumda manevi bir telkin, tıbbi yardımın yerini tutmaz; dinimiz de hastalıkta tedavi olmayı ve tedbir almayı öğütler.\n\n" +
    "Kendinizi iyi hissettiğinizde burada sizi dinlemeye hazırım. Geçmiş olsun.",
  child:
    "Merhaba küçük dostum. Burası büyükler için hazırlanmış bir sohbet alanı. Lütfen bu yazıyı annene, babana ya da yanındaki güvendiğin bir büyüğüne göster; onlarla konuşman en doğrusu.\n\n" +
    "Canın yanıyorsa, korkuyorsan ya da biri sana kötü davranıyorsa hemen bir büyüğüne söyle. Acil bir durumda bir büyükle birlikte **112**'yi arayabilirsiniz.\n\n" +
    "_(Bu mesajı bir yetişkin olarak yazdıysanız, sorunuzu yeniden yazabilirsiniz; size seve seve yardımcı olurum.)_",
  health:
    "Anlattığınız belirtiler bedeninizle ilgili ve önce bir sağlık uzmanının değerlendirmesi gerekir. Bu konuda manevi bir telkin, doktor muayenesinin yerini tutmaz; dinimiz de hastalıkta tedavi olmayı öğütler.\n\n" +
    "• Belirtiler şiddetliyse, aniden başladıysa ya da göğüs ağrısı, nefes darlığı, bayılma veya durmayan kanama varsa hemen **112**'yi arayın.\n" +
    "• Acil değilse en kısa sürede bir doktora veya sağlık kuruluşuna başvurun; randevu için **182 MHRS** hattını arayabilirsiniz.\n\n" +
    "Geçmiş olsun. Gönlünüzü yoran başka bir şey varsa burada sizi dinlemeye hazırım.",
} as const;

export const SAFETY_FOOTNOTES = {
  fatwa:
    "_(Ben fetva makamı değilim; bu cevap bağlayıcı bir dini hüküm değildir. Kesin hüküm için Diyanet İşleri Başkanlığı **ALO 190** hattına veya bulunduğunuz yerin müftülüğüne danışabilirsiniz.)_",
  health:
    "_(Sağlık belirtileriniz sürerse veya artarsa lütfen bir doktora başvurun; acil bir durumda **112**'yi arayın.)_",
} as const;

const NOTICES: Record<SafetyNoticeKind, SafetyNotice> = {
  crisis: {
    kind: "crisis",
    title: "Yalnız değilsiniz, hemen destek alın",
    message:
      "Kendinizi ya da bir başkasını tehlikede hissediyorsanız şimdi arayın. Tek dokunuşla arama yapabilirsiniz.",
    hotlines: [HOTLINE_112, HOTLINE_183],
  },
  health: {
    kind: "health",
    title: "Önce sağlığınız",
    message:
      "Fiziksel belirtilerde önce doktora başvurun. Acil durumda hemen 112'yi arayın.",
    hotlines: [HOTLINE_112, HOTLINE_182],
  },
  child: {
    kind: "child",
    title: "Bir büyüğüne haber ver",
    message:
      "Annene, babana ya da güvendiğin bir yetişkine söyle. Acil durumda bir büyükle birlikte 112'yi arayın.",
    hotlines: [HOTLINE_112],
  },
  fatwa: {
    kind: "fatwa",
    title: "Manevi Pusula fetva makamı değildir",
    message:
      "Bağlayıcı dini hüküm için Diyanet İşleri Başkanlığı ALO 190 hattına veya müftülüğe danışabilirsiniz.",
    hotlines: [HOTLINE_190],
  },
};

export function getSafetyNotice(kind: SafetyNoticeKind): SafetyNotice {
  const n = NOTICES[kind];
  return { ...n, hotlines: n.hotlines.map((h) => ({ ...h })) };
}

// ---------------------------------------------------------------------------
// Ana süzgeç
// ---------------------------------------------------------------------------

function bypass(
  category: SafetyCategory,
  ruleId: string,
  status: SafetyTriageResult["status"],
  replyText: string,
  noticeKind: SafetyNoticeKind
): SafetyTriageResult {
  return {
    category,
    ruleId,
    bypassModel: true,
    status,
    replyText,
    footnote: null,
    notice: getSafetyNotice(noticeKind),
  };
}

/**
 * Kullanıcı mesajını deterministik olarak süzer.
 * Eşleşme yoksa null döner (normal sohbet akışı aynen devam eder).
 */
export function runSafetyTriage(message: string): SafetyTriageResult | null {
  if (!message || !message.trim()) return null;
  const variants = buildMatchVariants(message);

  if (matchesAny(variants, SELF_HARM_PATTERNS)) {
    return bypass(
      "CRISIS_SELF_HARM",
      "SAFETY_CRISIS_SELF_HARM",
      "crisis_redirected",
      SAFETY_REPLIES.crisis,
      "crisis"
    );
  }

  if (matchesAny(variants, ABUSE_VICTIM_PATTERNS)) {
    return bypass(
      "ABUSE_VICTIM",
      "SAFETY_ABUSE_VICTIM",
      "crisis_redirected",
      SAFETY_REPLIES.abuse,
      "crisis"
    );
  }

  if (matchesAny(variants, HARM_TO_OTHERS_PATTERNS)) {
    return bypass(
      "HARM_TO_OTHERS",
      "SAFETY_HARM_TO_OTHERS",
      "crisis_redirected",
      SAFETY_REPLIES.harmToOthers,
      "crisis"
    );
  }

  const age = detectDeclaredAge(message);
  const isChild = age !== null && age < CHILD_AGE_LIMIT;
  const hasSevere = matchesAny(variants, SEVERE_HEALTH_PATTERNS);
  const hasMild = matchesAny(variants, MILD_HEALTH_PATTERNS);

  if (isChild && (hasSevere || hasMild)) {
    return bypass(
      "CHILD_WITH_HEALTH",
      "SAFETY_CHILD_WITH_HEALTH",
      "processed",
      SAFETY_REPLIES.childWithHealth,
      "child"
    );
  }

  if (hasSevere) {
    return bypass(
      "PHYSICAL_HEALTH_SEVERE",
      "SAFETY_PHYSICAL_HEALTH_SEVERE",
      "processed",
      SAFETY_REPLIES.severeHealth,
      "health"
    );
  }

  if (isChild) {
    return bypass(
      "CHILD_AGE",
      "SAFETY_CHILD_AGE",
      "processed",
      SAFETY_REPLIES.child,
      "child"
    );
  }

  if (hasMild) {
    const isWorshipQuestion = variants.some((v) => WORSHIP_CONTEXT_PATTERN.test(v));
    if (isWorshipQuestion) {
      return {
        category: "PHYSICAL_HEALTH",
        ruleId: "SAFETY_PHYSICAL_HEALTH_ADVISORY",
        bypassModel: false,
        status: "processed",
        replyText: null,
        footnote: SAFETY_FOOTNOTES.health,
        notice: getSafetyNotice("health"),
      };
    }
    return bypass(
      "PHYSICAL_HEALTH",
      "SAFETY_PHYSICAL_HEALTH",
      "processed",
      SAFETY_REPLIES.health,
      "health"
    );
  }

  if (
    matchesAny(variants, FATWA_PATTERNS) &&
    !matchesAny(variants, FICTION_PATTERNS)
  ) {
    return {
      category: "FATWA_LIMIT",
      ruleId: "SAFETY_FATWA_LIMIT",
      bypassModel: false,
      status: "processed",
      replyText: null,
      footnote: SAFETY_FOOTNOTES.fatwa,
      notice: getSafetyNotice("fatwa"),
    };
  }

  return null;
}

/** Kural kimliğinin bu süzgece ait olup olmadığını söyler. */
export function isSafetyTriageRule(ruleId: string | undefined | null): boolean {
  return typeof ruleId === "string" && ruleId.startsWith("SAFETY_");
}

/**
 * Model (veya mevcut kalkan) yanıtına, süzgecin istediği dipnotu ekler.
 * Yanıt zaten ilgili hattı içeriyorsa tekrar eklemez.
 */
export function appendSafetyFootnote(
  reply: string,
  triage: SafetyTriageResult | null
): string {
  if (!triage || triage.bypassModel || !triage.footnote) return reply;
  const text = reply || "";
  if (triage.category === "FATWA_LIMIT" && /\b190\b/.test(text)) return text;
  if (triage.category === "PHYSICAL_HEALTH" && /\b(112|doktor|hekim)/i.test(text)) {
    return text;
  }
  return text.trim() ? `${text.trimEnd()}\n\n${triage.footnote}` : triage.footnote;
}

/** Mevcut kalkanların kriz yönlendirmesinde de ekranda kriz kutusu göstermek için. */
export function resolveSafetyNotice(
  triage: SafetyTriageResult | null,
  status: string
): SafetyNotice | null {
  if (triage) return triage.notice;
  if (status === "crisis_redirected") return getSafetyNotice("crisis");
  return null;
}
