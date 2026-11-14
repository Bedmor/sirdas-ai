import crypto from "crypto";
import { dogrudanKisiselVeriyiMaskele } from "../gizlilik/maskeleme";

/**
 * Sırdaş AI - Mahremiyet ve Metin Temizleme Süzgeci (PII Anonymizer & Semantic De-identifier)
 * 
 * Bu modül; kullanıcıların sohbet esnasında paylaştığı doğrudan PII (TCKN, telefon, IBAN, e-posta)
 * ve dolaylı kimlik ifşa edici öğeleri (il, ilçe, dükkan/işletme adı, akraba özel isimleri)
 * yapay zeka hafızasına veya veritabanına girmeden önce temizler/soyutlar (k-anonymity koruması).
 *
 * İslami literatür, peygamberler, sahabe isimleri ve kutsal mekanlar BEYAZ LİSTE ile korunur.
 */

export interface AnonymizationResult {
  originalText: string;
  sanitizedText: string;
  redactedEntitiesCount: number;
  hasDirectPii: boolean;
  redactedCategories: string[];
}

// 1. KUTSAL VE İSLAMİ ŞAHSİYETLER/MEKANLAR BEYAZ LİSTESİ
// Bu isimler ve kelimeler özel isim olsa dahi ASLA sansürlenmez veya değiştirilmez.
export const SACRED_WHITELIST = new Set([
  // Peygamberler
  "adem", "idris", "nuh", "hud", "salih", "ibrahim", "ismail", "ishak",
  "yakup", "yusuf", "eyyub", "şuayb", "musa", "harun", "davud", "süleyman",
  "ilyas", "elyesa", "zülkifl", "yunus", "zekeriya", "yahya", "isa", "muhammed",
  // Sahabeler & Ehl-i Beyt
  "ebubekir", "ebu bekir", "ömer", "osman", "ali", "fatıma", "fatma", "ayşe",
  "hatice", "hasan", "hüseyin", "hamza", "bilal", "zeyd", "zübeyr", "talha",
  "abdurrahman", "ebu ubeyde", "selman", "ammar", "musab", "yasir", "sümeyye",
  // Kutsal Şehirler & Mekanlar
  "mekke", "medine", "kudüs", "kabe", "kâbe", "ravza", "uhud", "bedir",
  "hira", "sevr", "mina", "müzdelife", "arafat", "aksa", "mescid-i aksa",
  // Sırdaş AI Kaynakları & Alimler
  "halis aydemir", "halis hoca", "gazali", "rabbani", "buhari", "müslim",
  "ebu hanife", "şafi", "malik", "ahmed bin hanbel", "bediüzzaman"
]);

// 2. TÜRKİYE İLLERİ VE YAYGIN İLÇELERİ (Dolaylı Tanımlayıcılar)
export const TURKISH_PROVINCES = [
  "adana", "adıyaman", "afyonkarahisar", "afyon", "ağrı", "amasya", "ankara",
  "antalya", "artvin", "aydın", "balıkesir", "bilecik", "bingöl", "bitlis",
  "bolu", "burdur", "bursa", "çanakkale", "çankırı", "çorum", "denizli",
  "diyarbakır", "edirne", "elazığ", "erzincan", "erzurum", "eskişehir",
  "gaziantep", "giresun", "gümüşhane", "hakkari", "hatay", "isparta",
  "mersin", "i̇çel", "istanbul", "i̇zmir", "kars", "kastamonu", "kayseri",
  "kırklareli", "kırşehir", "kocaeli", "konya", "kütahya", "malatya",
  "manisa", "kahramanmaraş", "maraş", "mardin", "muğla", "muş", "nevşehir",
  "niğde", "ordu", "rize", "sakarya", "samsun", "siirt", "sinop", "sivas",
  "tekirdağ", "tokat", "trabzon", "tunceli", "şanlıurfa", "urfa", "uşak",
  "van", "yozgat", "zonguldak", "aksaray", "bayburt", "karaman", "kırıkkale",
  "batman", "şırnak", "bartın", "ardahan", "iğdır", "yalova", "karabük",
  "kilis", "osmaniye", "düzce"
];

export const PROMINENT_DISTRICTS = [
  "serdivan", "adapazarı", "erenler", "arifiye", "hendek", "akyazı", "sapanca",
  "çankaya", "keçiören", "mamak", "yenimahalle", "etimesgut", "sincan", "altındağ",
  "kadıköy", "üsküdar", "beşiktaş", "şişli", "bakırköy", "fatih", "beyoğlu",
  "beylikdüzü", "esenyurt", "pendik", "ümraniye", "maltepe", "kartal", "sarıyer",
  "karşıyaka", "bornova", "konak", "buca", "çiğli", "balçova", "gaziemir",
  "nilüfer", "osmangazi", "yıldırım", "mudanya", "gemlik", "inegöl",
  "selçuklu", "meram", "karatay", "şahinbey", "şehitkamil", "muratpaşa", "kepez",
  "alanya", "manavgat", "bodrum", "fethiye", "marmaris", "kuşadası", "didim",
  "gebze", "darıca", "izmit", "körfez", "gölcük", "çorlu", "çerkezköy"
];

// -----------------------------------------------------------------------------
// Ortak yardımcılar
//
// Not (14.11 düzeltmesi): JavaScript'te `\b` yalnızca İngilizce harfleri kelime
// sayar; "ç, ğ, ı, ö, ş, ü" ile başlayan/biten kelimelerde sınır yanlış çıkar.
// Ayrıca `i` bayrağı `[A-ZÇĞİÖŞÜ]` sınıfını küçük harfe de açtığı için
// "Kardeşim yarın gelecek" cümlesindeki "yarın" özel isim sanılıp siliniyordu.
// Bu yüzden aşağıda harf sınırları Unicode ile yazılır ve özel isim aramaları
// büyük/küçük harf duyarlıdır.
// -----------------------------------------------------------------------------

/** Unicode harf/rakam sınırı (Türkçe karakterlerde doğru çalışır). */
const SOL_SINIR = String.raw`(?<![\p{L}\p{N}])`;
const SAG_SINIR = String.raw`(?![\p{L}\p{N}])`;

/** Büyük harfle başlayan özel isim (Ahmet, Zeynep, Ömer, İlknur). */
const OZEL_ISIM = String.raw`\p{Lu}\p{Ll}+`;

function trBuyukHarf(c: string): string {
  if (c === "i") return "İ";
  if (c === "ı") return "I";
  return c.toLocaleUpperCase("tr-TR");
}

function trKucuk(s: string): string {
  return s.toLocaleLowerCase("tr-TR").replace(/̇/g, "");
}

/** Kelimenin ilk harfi büyük veya küçük olabilir; geri kalanı küçük harf kalır. */
function ilkHarfEsnek(kelime: string): string {
  const ilk = kelime.charAt(0);
  return `[${ilk}${trBuyukHarf(ilk)}]${kelime.slice(1)}`;
}

/** Yalnızca büyük harfle başlayan yazımı arar ("Serdivan", "Çankaya"). */
function ilkHarfBuyuk(kelime: string): string {
  return trBuyukHarf(kelime.charAt(0)) + kelime.slice(1);
}

/** Türkçe büyük/küçük harf duyarsız kalıp (i/İ, ı/I ayrımı korunur). */
function harfDuyarsiz(kelime: string): string {
  return trKucuk(kelime.normalize("NFC"))
    .split("")
    .map((c) => {
      if (/\p{Ll}/u.test(c)) return `[${c}${trBuyukHarf(c)}]`;
      if (c === "-" || c === ".") return `\\${c}`;
      return c;
    })
    .join("");
}

const KONUM_KUCUK = new Set([...TURKISH_PROVINCES, ...PROMINENT_DISTRICTS].map(trKucuk));

// -----------------------------------------------------------------------------
// Ünlü uyumuna göre ek çekimi ("oğlum" + yönelme = "oğluma", "eşim" = "eşime")
// -----------------------------------------------------------------------------
function sonUnlu(kelime: string): string {
  const unluler = kelime.match(/[aeıioöuü]/g);
  return unluler ? unluler[unluler.length - 1] : "e";
}

function kalinMi(kelime: string): boolean {
  return /[aıou]/.test(sonUnlu(kelime));
}

function dortluUnlu(kelime: string): string {
  const u = sonUnlu(kelime);
  if (u === "a" || u === "ı") return "ı";
  if (u === "o" || u === "u") return "u";
  if (u === "ö" || u === "ü") return "ü";
  return "i";
}

/**
 * İsmin aldığı eki ("'e", "'yi", "'nin", "'le", "'de", "'den") yakınlık kelimesine
 * taşır. Ek tanınmazsa yakınlık kelimesi eksiz kalır.
 */
function yakinligaEkle(yakinlik: string, ek: string): string {
  const s = trKucuk(ek.replace(/^['’]/, ""));
  if (!s) return yakinlik;
  const kalin = kalinMi(yakinlik);
  const d4 = dortluUnlu(yakinlik);
  if (/^y?l[ae]$/.test(s)) return yakinlik + (kalin ? "la" : "le");
  if (/^[dt][ae]n$/.test(s)) return yakinlik + (kalin ? "dan" : "den");
  if (/^[dt][ae]ki$/.test(s)) return yakinlik + (kalin ? "daki" : "deki");
  if (/^[dt][ae]$/.test(s)) return yakinlik + (kalin ? "da" : "de");
  if (/^n?[ıiuü]n$/.test(s)) return yakinlik + d4 + "n";
  if (/^y?[ae]$/.test(s)) return yakinlik + (kalin ? "a" : "e");
  if (/^y?[ıiuü]$/.test(s)) return yakinlik + d4;
  return yakinlik;
}

const YAKINLIK_KELIMELERI = [
  "oğlum", "kızım", "eşim", "kardeşim", "abim", "ablam", "babam", "annem",
  "arkadaşım", "dostum", "ortağım", "komşum",
];

/** "oğlum Ahmet'e" kalıbı: yakınlık kelimesi + büyük harfli isim + isteğe bağlı kesmeli ek. */
const AKRABA_ISIM_DESENI = new RegExp(
  String.raw`${SOL_SINIR}(${YAKINLIK_KELIMELERI.map(ilkHarfEsnek).join("|")})\s+(${OZEL_ISIM})(['’]\p{Ll}+)?${SAG_SINIR}`,
  "gu"
);

/** "adı da Ahmet" / "ismi Mehmet" kalıbı (isim büyük harfle yazılmış olmalı). */
const ISIM_IFSA_DESENI = new RegExp(
  String.raw`${SOL_SINIR}(?:${["adı", "adi", "ismi"].map(ilkHarfEsnek).join("|")})\s+(?:da\s+|de\s+|ise\s+)?(${OZEL_ISIM})(?:['’]\p{Ll}+)?${SAG_SINIR}`,
  "gu"
);

/** İsim sanılmaması gereken büyük harfli kelimeler (konumlar ve kutsal isimler). */
function isimSayilmaz(isim: string): boolean {
  const k = trKucuk(isim);
  return SACRED_WHITELIST.has(k) || KONUM_KUCUK.has(k);
}

// -----------------------------------------------------------------------------
// Konum kalıpları
// -----------------------------------------------------------------------------

/** Kesmeli ek ("'da", "'daki") veya kesmesiz yaygın yer ekleri. */
const KONUM_EKI = String.raw`(['’]\p{Ll}+|daki|deki|taki|teki|dan|den|tan|ten|da|de|ta|te|ya|ye|a|e)?`;

/** İl + ilçe birlikte ("Sakarya Serdivan'da"): kimliği daraltan ikili, maskelenir. */
const IL_ILCE_DESENI = new RegExp(
  String.raw`${SOL_SINIR}(?:${TURKISH_PROVINCES.map(harfDuyarsiz).join("|")})\s+(?:${PROMINENT_DISTRICTS.map(harfDuyarsiz).join("|")})${KONUM_EKI}${SAG_SINIR}`,
  "gu"
);

/**
 * Tek başına ilçe ("Serdivan'daki dükkanımda"): kimliği daraltır, maskelenir.
 * Yalnızca büyük harfle yazılmış ilçe adı aranır. Aynı zamanda sıradan kelime
 * veya kişi adı olan ilçeler (konak, kartal, körfez, yıldırım, fatih...) ancak
 * kesmeli ekle yazılırsa ("Kartal'da") konum sayılır.
 *
 * Tek başına il adı ("İstanbul'da yaşıyorum") kişiyi tanımlamaz; maskelenmez.
 */
const SIRADAN_KELIME_ILCELER = new Set([
  "konak", "kartal", "körfez", "yıldırım", "hendek", "fatih", "meram", "kepez",
  "gemlik", "buca", "darıca", "erenler", "maltepe", "sincan", "mamak", "didim",
]);

const ILCE_DESENI = new RegExp(
  String.raw`${SOL_SINIR}(${PROMINENT_DISTRICTS.map(ilkHarfBuyuk).join("|")})${KONUM_EKI}${SAG_SINIR}`,
  "gu"
);

function konumYerine(ek: string | undefined): string {
  const s = trKucuk((ek || "").replace(/^['’]/, ""));
  if (!s) return "yaşadığım yer";
  if (/^[dt][ae]ki$/.test(s)) return "bulunduğum yerdeki";
  if (/^[dt][ae]n$/.test(s)) return "bulunduğum yerden";
  if (/^[dt][ae]$/.test(s)) return "bulunduğum yerde";
  if (/^n?[ıiuü]n$/.test(s)) return "yaşadığım yerin";
  if (/^y?[ae]$/.test(s)) return "yaşadığım yere";
  if (/^l[ıiuü]/.test(s)) return "oralı" + s.replace(/^l[ıiuü]/, "");
  return "yaşadığım yer";
}

/**
 * Gelen kullanıcı mesajını analiz eder ve tüm doğrudan / dolaylı PII öğelerini
 * manevi bağlamı ve anlam bütünlüğünü koruyarak genelleştirir / temizler.
 * Kişisel veri bulunmayan mesaj HİÇ değişmeden döner.
 */
export function sanitizeIncomingUserMessage(rawText: string): AnonymizationResult {
  if (!rawText || typeof rawText !== "string") {
    return {
      originalText: "",
      sanitizedText: "",
      redactedEntitiesCount: 0,
      hasDirectPii: false,
      redactedCategories: [],
    };
  }

  let text = rawText;
  let count = 0;
  let hasDirect = false;
  const categories: string[] = [];
  const isaretle = (k: string) => {
    count++;
    if (!categories.includes(k)) categories.push(k);
  };

  // =========================================================================
  // 1. ADIM: KATİ DOĞRUDAN PII (Direct Identifiers)
  // Tek kaynak: src/lib/gizlilik/maskeleme.ts (e-posta, IBAN, kart, TC kimlik, telefon, açık adres).
  // =========================================================================
  const dogrudan = dogrudanKisiselVeriyiMaskele(text);
  if (dogrudan.adet > 0) {
    text = dogrudan.metin;
    hasDirect = true;
    count += dogrudan.adet;
    categories.push(...dogrudan.kategoriler);
  }

  // =========================================================================
  // 2. ADIM: AKRABA / YAKIN + ÖZEL İSİM SOYUTLAMA (Büyük/Küçük Harf Duyarlı)
  // "oğlum Ahmet'e kızdım" -> "oğluma kızdım"; "Kızım Zeynep'le" -> "Kızımla"
  // İsim büyük harfle yazılmış olmalı: "Kardeşim yarın gelecek" DEĞİŞMEZ.
  // =========================================================================
  text = text.replace(
    AKRABA_ISIM_DESENI,
    (match: string, relation: string, name: string, suffix?: string) => {
      if (isimSayilmaz(name)) return match;
      isaretle("AKRABA_ISIM");
      const replacement = yakinligaEkle(trKucuk(relation), suffix || "");
      return /^\p{Lu}/u.test(relation)
        ? trBuyukHarf(replacement.charAt(0)) + replacement.slice(1)
        : replacement;
    }
  );

  // "adı da Ahmet..." / "ismi Mehmet..." kalıpları ("adı geçen", "ismi bile" değişmez)
  text = text.replace(ISIM_IFSA_DESENI, (match: string, name: string) => {
    if (isimSayilmaz(name)) return match;
    isaretle("ISIM_IFSA");
    return "kendisi";
  });

  // =========================================================================
  // 3. ADIM: İL + İLÇE BİRLİKTELİĞİ ("Sakarya Serdivan'da" / "İstanbul Kadıköy'deki")
  // =========================================================================
  text = text.replace(IL_ILCE_DESENI, (_m: string, ek?: string) => {
    isaretle("IL_ILCE_KOMBO");
    return konumYerine(ek);
  });

  // =========================================================================
  // 4. ADIM: TEK BAŞINA İLÇE ("Serdivan'daki dükkanımda"). Tek başına il korunur.
  // =========================================================================
  text = text.replace(ILCE_DESENI, (match: string, ilce: string, ek?: string) => {
    const k = trKucuk(ilce);
    if (SACRED_WHITELIST.has(k)) return match;
    const kesmeli = !!ek && /^['’]/.test(ek);
    if (SIRADAN_KELIME_ILCELER.has(k) && !kesmeli) return match;
    isaretle("KONUM");
    return konumYerine(ek);
  });

  // Kişisel veri yoksa mesaj olduğu gibi döner (boşluk, büyük harf vb. de korunur).
  if (count === 0) {
    return {
      originalText: rawText,
      sanitizedText: rawText,
      redactedEntitiesCount: 0,
      hasDirectPii: false,
      redactedCategories: [],
    };
  }

  // "bulunduğum yerdeki dükkanımda" -> "dükkanımda" (Akıcı Türkçeleştirme)
  text = text.replace(
    /(?<!\p{L})[Bb]ulunduğum yerdeki\s+(dükkan[ıi]mda|evimde|iş\s*yerimde|ofisimde)(?!\p{L})/gu,
    "$1"
  );
  // Cümle başındaki küçük harfi düzelt
  text = text.replace(/^\s*(\p{Ll})/u, (_: string, c: string) => trBuyukHarf(c));
  // Çoklu boşlukları toparla
  text = text.replace(/[ \t]{2,}/g, " ").trim();

  return {
    originalText: rawText,
    sanitizedText: text,
    redactedEntitiesCount: count,
    hasDirectPii: hasDirect,
    redactedCategories: categories,
  };
}

/**
 * Blind Indexing / Kriptografik Kimlik Maskeleme:
 * Telefon numarasını veritabanında düz metin olarak saklamamak için tek yönlü HMAC hash üretir.
 * Tüm Türkiye telefon formatlarını (+90 5xx, 05xx, 5xx) standartlaştırıp tek hash üretir.
 */
export function hashPhoneNumberBlindIndex(
  phoneNumber: string,
  customPepper?: string
): string {
  const pepper =
    customPepper ||
    process.env.SIRDAS_PRIVACY_PEPPER ||
    process.env.AUTH_SECRET ||
    "sirdas_celik_kasa_privacy_pepper_2026";

  let digits = phoneNumber.replace(/[^0-9]/g, "");
  // +90 veya 90 ile başlıyorsa kırp
  if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return crypto.createHmac("sha256", pepper).update(digits).digest("hex");
}
