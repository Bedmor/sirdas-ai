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

// Tüm coğrafi yerleri birleşik Set'e alıyoruz
const ALL_LOCATIONS = new Set([
  ...TURKISH_PROVINCES,
  ...PROMINENT_DISTRICTS
]);

// Türkçe ek çekimleri regex parçacığı:
// 'da, 'de, 'ta, 'te, 'daki, 'deki, 'ten, 'tan, 'den, 'dan, 'ye, 'ya, 'e, 'a, 'li, 'lı, 'lu, 'lü
const TURKISH_SUFFIX_REGEX_PART =
  "(?:'?(?:da|de|ta|te|daki|deki|taki|teki|dan|den|tan|ten|ya|ye|a|e|na|ne|nda|nde|ndan|nden|l[ıiuü]|l[ıiuü]k))?";

/**
 * Gelen kullanıcı mesajını analiz eder ve tüm doğrudan / dolaylı PII öğelerini
 * manevi bağlamı ve anlam bütünlüğünü koruyarak genelleştirir / temizler.
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

  // =========================================================================
  // 1. ADIM: KATİ DOĞRUDAN PII (Direct Identifiers)
  // =========================================================================

  // Tek kaynak: src/lib/gizlilik/maskeleme.ts (e-posta, IBAN, kart, TC kimlik, telefon, açık adres).
  const dogrudan = dogrudanKisiselVeriyiMaskele(text);
  if (dogrudan.adet > 0) {
    text = dogrudan.metin;
    hasDirect = true;
    count += dogrudan.adet;
    categories.push(...dogrudan.kategoriler);
  }

  // =========================================================================
  // 2. ADIM: AKRABA / YAKIN + ÖZEL İSİM SOYUTLAMA (Büyük/Küçük Harf Duyarlı)
  // Örn: "oğlum Ahmet'e kızdım" -> "oğluma kızdım"
  // Örn: "Kızım Zeynep'le tartıştık" -> "Kızımla tartıştık"
  // Örn: "eşim Mehmet" -> "eşim"
  // =========================================================================
  const kinshipWithNamedPerson =
    /\b(oğlum|kızım|eşim|kardeşim|abim|ablam|babam|annem|arkadaşım|dostum|ortağım|komşum)\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)('?[a-zçğıöşü]+)?\b/giu;

  text = text.replace(kinshipWithNamedPerson, (match, relation, name, suffix) => {
    const lowerName = (name || "").toLowerCase();
    // Kutsal şahsiyet atfı ise dokunma (Örn: "babam Hasan'a dua ediyorum")
    if (SACRED_WHITELIST.has(lowerName)) {
      return match;
    }

    count++;
    if (!categories.includes("AKRABA_ISIM")) categories.push("AKRABA_ISIM");

    const isCapital = /^[A-ZÇĞİÖŞÜ]/.test(relation);
    const relLower = relation.toLowerCase();
    let replacement = relLower;

    // Suffix'e göre doğal Türkçe çekim ekleme
    const s = (suffix || "").replace("'", "").toLowerCase();
    if (s.startsWith("e") || s.startsWith("a")) {
      if (relLower === "oğlum") replacement = "oğluma";
      else if (relLower === "kızım") replacement = "kızıma";
      else if (relLower === "eşim") replacement = "eşime";
      else if (relLower === "kardeşim") replacement = "kardeşime";
      else if (relLower === "abim") replacement = "abime";
      else if (relLower === "ablam") replacement = "ablama";
      else if (relLower === "babam") replacement = "babama";
      else if (relLower === "annem") replacement = "anneme";
      else if (relLower === "arkadaşım") replacement = "arkadaşıma";
      else if (relLower === "ortağım") replacement = "ortağıma";
    } else if (s.startsWith("i") || s.startsWith("ı") || s.startsWith("u") || s.startsWith("ü")) {
      if (relLower === "oğlum") replacement = "oğlumu";
      else if (relLower === "kızım") replacement = "kızımı";
      else if (relLower === "eşim") replacement = "eşimi";
    } else if (s.startsWith("le") || s.startsWith("la")) {
      if (relLower === "oğlum") replacement = "oğlumla";
      else if (relLower === "kızım") replacement = "kızımla";
      else if (relLower === "eşim") replacement = "eşimle";
      else if (relLower === "kardeşim") replacement = "kardeşimle";
    }

    if (isCapital) {
      replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }

    return replacement;
  });

  // "adı da Ahmet..." / "ismi Mehmet..." kalıpları
  const nameDisclosurePattern =
    /\b(?:ad[ıi]|ismi)\s+(?:da\s+|ise\s+)?([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\b/giu;
  text = text.replace(nameDisclosurePattern, (match, name) => {
    const lower = name.toLowerCase();
    if (SACRED_WHITELIST.has(lower)) return match;
    count++;
    if (!categories.includes("ISIM_IFSA")) categories.push("ISIM_IFSA");
    return "kendisi";
  });

  // =========================================================================
  // 3. ADIM: İKİLİ COĞRAFİ KONUM KALIPLARI (İl + İlçe Birlikteliği)
  // Örn: "Sakarya Serdivan'da" / "İstanbul Kadıköy'deki"
  // =========================================================================
  for (const province of TURKISH_PROVINCES) {
    if (SACRED_WHITELIST.has(province)) continue;

    for (const district of PROMINENT_DISTRICTS) {
      if (district === province) continue;
      const combinedLocRegex = new RegExp(
        `\\b${province}\\s+${district}${TURKISH_SUFFIX_REGEX_PART}\\b`,
        "gi"
      );

      if (combinedLocRegex.test(text)) {
        text = text.replace(combinedLocRegex, (m) => {
          count++;
          if (!categories.includes("IL_ILCE_KOMBO")) categories.push("IL_ILCE_KOMBO");
          if (/daki|deki|taki|teki/i.test(m)) return "bulunduğum yerdeki";
          if (/dan|den|tan|ten/i.test(m)) return "bulunduğum yerden";
          if (/da|de|ta|te/i.test(m)) return "bulunduğum yerde";
          if (/ya|ye|a|e/i.test(m)) return "yaşadığım yere";
          return "bulunduğum şehirde";
        });
      }
    }
  }

  // =========================================================================
  // 4. ADIM: TEKİL İL VE İLÇE İSİMLERİ (Örn: "Serdivan'daki dükkanımda")
  // =========================================================================
  for (const loc of ALL_LOCATIONS) {
    if (SACRED_WHITELIST.has(loc)) continue;

    const locRegex = new RegExp(
      `\\b${loc}${TURKISH_SUFFIX_REGEX_PART}\\b`,
      "gi"
    );

    if (locRegex.test(text)) {
      text = text.replace(locRegex, (match) => {
        count++;
        if (!categories.includes("KONUM")) categories.push("KONUM");

        const m = match.toLowerCase();
        if (/daki|deki|taki|teki/i.test(m)) {
          return "bulunduğum yerdeki";
        }
        if (/dan|den|tan|ten/i.test(m)) {
          return "bulunduğum yerden";
        }
        if (/da|de|ta|te/i.test(m)) {
          return "bulunduğum yerde";
        }
        if (/ya|ye|a|e/i.test(m)) {
          return "yaşadığım yere";
        }
        return "yaşadığım şehir";
      });
    }
  }

  // "bulunduğum yerdeki dükkanımda" -> "dükkanımda" (Akıcı Türkçeleştirme)
  text = text.replace(/\bbulunduğum yerdeki\s+(dükkan[ıi]mda|evimde|iş\s*yerimde|ofisimde)\b/gi, "$1");
  // Cümle başındaki küçük harfi düzelt
  text = text.replace(/^\s*([a-zçğıöşü])/u, (_, c) => c.toUpperCase());

  // Çoklu boşlukları toparla
  text = text.replace(/\s{2,}/g, " ").trim();

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
