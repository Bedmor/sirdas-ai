/**
 * Üslup süzgecinin küçük, deterministik sınıflandırıcıları.
 * Hepsi yerel çalışır; model çağrısı ya da ağ isteği yapmaz.
 * Metinler, güvenlik süzgeciyle aynı Türkçe katlama (ı->i, ş->s ...) üzerinden taranır.
 */
import {
  CHILD_AGE_LIMIT,
  buildMatchVariants,
  detectDeclaredAge,
  foldTurkish,
  runSafetyTriage,
  type SafetyCategory,
} from "../safety/triage";

function eslesir(metin: string, desenler: ReadonlyArray<RegExp>): boolean {
  const varyantlar = buildMatchVariants(metin);
  return desenler.some((d) => varyantlar.some((v) => d.test(v)));
}

// ---------------------------------------------------------------------------
// Güvenlik önceliği: kriz, sağlık ve çocuk işaretleri her zaman üslup süzgecinden önce gelir
// ---------------------------------------------------------------------------

const GUVENLIK_ONCELIKLI: ReadonlySet<SafetyCategory> = new Set<SafetyCategory>([
  "CRISIS_SELF_HARM",
  "ABUSE_VICTIM",
  "HARM_TO_OTHERS",
  "CHILD_WITH_HEALTH",
  "PHYSICAL_HEALTH_SEVERE",
  "CHILD_AGE",
  "PHYSICAL_HEALTH",
]);

/** Mesajda kriz, sağlık veya çocuk işareti varsa true döner. */
export function guvenlikOncelikliMi(mesaj: string): boolean {
  const triage = runSafetyTriage(mesaj);
  return Boolean(triage && GUVENLIK_ONCELIKLI.has(triage.category));
}

// ---------------------------------------------------------------------------
// 1. Kurgu ve mizah tespiti
// ---------------------------------------------------------------------------

/** Bariz kurgu / absürt öğeler (katlanmış metin). "Cin" gerçek bir inanç konusu olduğu için listede yok. */
const KURGU_DESENLERI: ReadonlyArray<{ ad: string; desen: RegExp }> = [
  { ad: "ejderha", desen: /\b(ejderha|ejder)\p{L}*/u },
  { ad: "uzaylı", desen: /\buzayli\p{L}*/u },
  { ad: "zaman makinesi", desen: /\bzaman\s*makine\p{L}*|\bzamanda\s*yolculuk/u },
  { ad: "Mars", desen: /\bmars(ta|da|a|taki|daki|in|li|liyim|ya)\b|\bmars\s*(koloni|gezegen|us)\p{L}*/u },
  { ad: "Mars uyduları", desen: /\b(phobos|deimos)\b/ },
  { ad: "tek boynuzlu at", desen: /\b(unicorn|tek\s*boynuzlu)\p{L}*/u },
  { ad: "zombi", desen: /\bzombi\p{L}*/u },
  { ad: "vampir", desen: /\bvampir\p{L}*/u },
  { ad: "hobbit", desen: /\b(hobbit|hogwarts|buyucu\s*okulu)\p{L}*/u },
  { ad: "dinozor", desen: /\bdinozor\p{L}*/u },
  { ad: "ışınlanma", desen: /\bisinlan\p{L}*/u },
  { ad: "süper kahraman", desen: /\bsuper\s*kahraman\p{L}*/u },
  { ad: "konuşan hayvan", desen: /\b(konusan|vergi\s*veren)\s*(kedi|kopek|esek|kus|balik)\p{L}*/u },
  { ad: "robot eş", desen: /\brobot\s*(esim|kocam|karim|nisanlim)\b/ },
];

/** Kurgunun içinde gizlenen gerçek dini soru işaretleri. */
const GERCEK_DINI_SORU: ReadonlyArray<RegExp> = [
  /\b(namaz|kible|oruc|abdest|teyemmum|secde|rekat|ezan|zekat|kuran|dua|cuma|bayram|hac|umre|caiz|helal|haram|gunah|sevap)\p{L}*/u,
];

/** Küçük yaş beyanıyla çelişen yetişkin hayatı konuları. */
const YETISKIN_KONULARI: ReadonlyArray<RegExp> = [
  /\b(borc|kredi|faiz|vergi|maas|kira|patron|mudur|isyeri|dukkan|ticaret|esim|kocam|karim|evlilik|bosan|nikah|kayinvalide|emekli|torun)\p{L}*/u,
];

export interface KurguSonucu {
  kurgu: boolean;
  isaretler: string[];
  gercekDiniSoru: boolean;
  yasCeliskisi: boolean;
}

/**
 * Mesajın bariz bir kurgu/şaka içerip içermediğini söyler.
 * Kriz, sağlık veya çocuk işareti varsa kurgu SAYILMAZ (güvenlik önce gelir).
 */
export function kurguMizahTespit(mesaj: string): KurguSonucu {
  const bos: KurguSonucu = { kurgu: false, isaretler: [], gercekDiniSoru: false, yasCeliskisi: false };
  if (!mesaj || !mesaj.trim()) return bos;

  const yas = detectDeclaredAge(mesaj);
  const yasCeliskisi =
    yas !== null && yas < CHILD_AGE_LIMIT && eslesir(mesaj, YETISKIN_KONULARI);

  if (guvenlikOncelikliMi(mesaj)) {
    // Çocuk beyanı güvenlik süzgecinde zaten yetişkine yönlendirilir; çelişki işaretini yine de taşı.
    return { ...bos, yasCeliskisi };
  }

  const varyantlar = buildMatchVariants(mesaj);
  const isaretler = KURGU_DESENLERI.filter(({ desen }) =>
    varyantlar.some((v) => desen.test(v))
  ).map(({ ad }) => ad);

  const kurgu = isaretler.length > 0;
  return {
    kurgu,
    isaretler,
    gercekDiniSoru: kurgu && eslesir(mesaj, GERCEK_DINI_SORU),
    yasCeliskisi,
  };
}

// ---------------------------------------------------------------------------
// 2. Gece saati
// ---------------------------------------------------------------------------

/** Türkiye (veya kullanıcının) yerel saatiyle 00:30 - 04:59 aralığında mı? */
export function geceGecSaatMi(saat: number, dakika: number): boolean {
  if (!Number.isFinite(saat) || !Number.isFinite(dakika)) return false;
  return (saat === 0 && dakika >= 30) || (saat >= 1 && saat < 5);
}

/** Verilen anın Europe/Istanbul saatini döndürür. */
export function turkiyeSaati(an: Date = new Date()): { saat: number; dakika: number } {
  const parcalar = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(an);
  const saat = Number(parcalar.find((p) => p.type === "hour")?.value ?? 12) % 24;
  const dakika = Number(parcalar.find((p) => p.type === "minute")?.value ?? 0);
  return { saat, dakika };
}

// ---------------------------------------------------------------------------
// 3. Döngü tespiti (son kullanıcı mesajlarıyla benzerlik)
// ---------------------------------------------------------------------------

const DOLGU_KELIMELER = new Set([
  "bir", "bu", "su", "o", "ve", "ile", "ama", "fakat", "cok", "daha", "gibi", "icin",
  "ben", "beni", "bana", "benim", "sen", "seni", "sana", "biz", "siz", "onlar", "mi", "mu",
  "de", "da", "ki", "ne", "neden", "nasil", "hala", "yine", "artik", "hic", "her",
  "sey", "seyi", "kadar", "diye", "gercekten", "sadece", "olarak", "olan", "oldu", "var",
  "yok", "tamam", "evet", "hayir", "ya", "iste", "bile",
]);

/** Kaba Türkçe kök: katlanmış kelimenin ilk 5 harfi (ekler büyük ölçüde atılır). */
export function kokler(metin: string): Set<string> {
  const kelimeler = foldTurkish(metin)
    .split(" ")
    .filter((k) => k.length >= 3 && !DOLGU_KELIMELER.has(k) && !/^\d+$/.test(k));
  return new Set(kelimeler.map((k) => k.slice(0, 5)));
}

/** İki metnin kök kümeleri arasındaki Jaccard benzerliği (0-1). */
export function benzerlik(a: string, b: string): number {
  const ka = kokler(a);
  const kb = kokler(b);
  if (ka.size === 0 || kb.size === 0) return 0;
  let ortak = 0;
  for (const k of ka) if (kb.has(k)) ortak++;
  return ortak / (ka.size + kb.size - ortak);
}

export interface DonguSonucu {
  dongu: boolean;
  enYuksekBenzerlik: number;
  benzerMesajSayisi: number;
}

const GUCLU_ESIK = 0.6;
const ORTA_ESIK = 0.3;
const EN_AZ_KOK = 3;

/**
 * Yeni mesaj, önceki kullanıcı mesajlarının tekrarı mı?
 * Döngü: bir önceki mesajla güçlü benzerlik (>= 0.6) veya en az iki mesajla orta benzerlik (>= 0.3).
 * Kısa mesajlar ("teşekkürler", "evet") döngü sayılmaz.
 */
export function donguTespit(mesaj: string, oncekiKullaniciMesajlari: string[]): DonguSonucu {
  const bos: DonguSonucu = { dongu: false, enYuksekBenzerlik: 0, benzerMesajSayisi: 0 };
  if (kokler(mesaj).size < EN_AZ_KOK) return bos;

  const skorlar = oncekiKullaniciMesajlari
    .slice(-5)
    .filter((m) => kokler(m).size >= EN_AZ_KOK)
    .map((m) => benzerlik(mesaj, m));
  if (skorlar.length === 0) return bos;

  const enYuksek = Math.max(...skorlar);
  const ortaSayisi = skorlar.filter((s) => s >= ORTA_ESIK).length;
  return {
    dongu: enYuksek >= GUCLU_ESIK || ortaSayisi >= 2,
    enYuksekBenzerlik: Number(enYuksek.toFixed(2)),
    benzerMesajSayisi: ortaSayisi,
  };
}

// ---------------------------------------------------------------------------
// 4. Kalıp açılış tespiti (önceki asistan cevaplarının ilk cümleleri)
// ---------------------------------------------------------------------------

/** Önceki asistan cevaplarının açılışlarını (ilk cümle, en çok 60 karakter) döndürür. */
export function oncekiAcilislar(oncekiAsistanCevaplari: string[], enFazla = 3): string[] {
  const acilislar: string[] = [];
  for (const cevap of oncekiAsistanCevaplari.slice(-enFazla)) {
    const ilk = (cevap || "")
      .replace(/[*_#>`]/g, "")
      .trim()
      .split(/[.!?\n]/)[0]
      ?.trim();
    if (!ilk || ilk.length < 8) continue;
    const kisa = ilk.length > 60 ? `${ilk.slice(0, 60).replace(/\s+\S*$/, "")}...` : ilk;
    if (!acilislar.includes(kisa)) acilislar.push(kisa);
  }
  return acilislar;
}

// ---------------------------------------------------------------------------
// 5. Diğer kısa işaretler
// ---------------------------------------------------------------------------

const YALNIZLASTIRMA_DESENLERI: ReadonlyArray<RegExp> = [
  /\bsadece\s*(sen|seninle|sana)\b/,
  /\bbir\s*tek\s*(sen|seninle|sana)\b/,
  /\btek\s*(sirdasim|dostum|arkadasim|dayanagim|yoldasim)\s*(sen|sensin)/,
  /\b(sen|sensin)\s*(benim\s*)?tek\s*(sirdasim|dostum|arkadasim|dayanagim)/,
  /\bsenden\s*baska\s*(kimsem|kimse|kimim)/,
  /\bkimsem\s*(yok|kalmadi)/,
  /\b(kimseye|insanlara|ailemize|aileme)\s*guvenmiyorum/,
  /\bherkesten\s*(koptum|uzaklastim|kactim)/,
  /\binsanlarla\s*(konusmak|gorusmek)\s*istemiyorum/,
];

const KAPANIS_DESENLERI: ReadonlyArray<RegExp> = [
  /^(cok\s*)?(tesekkur|sag\s*ol|eyvallah|allaha\s*emanet|allah\s*razi|iyi\s*geceler|hayirli\s*geceler|hosca\s*kal|gorusmek\s*uzere|gorusuruz|amin|kendine\s*iyi\s*bak)/,
];

const GECMIS_YUKU_DESENLERI: ReadonlyArray<RegExp> = [
  /\bkeske\b/,
  /\bpisman\p{L}*/u,
  /\bhata\s*(yaptim|ettim|isledim)/,
  /\bgunah\s*(isledim|islemistim|yaptim)/,
  /\bkendimi\s*affedemiyorum/,
  /\baffedilir\s*miyim|\baffeder\s*mi\b|\baffolur\s*mu/,
  /\bvicdan\s*azab/,
  /\bgecmiste\s*(yaptigim|yaptiklarim|cok)/,
];

const SESSIZ_KARARTMA_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(porno|mustehcen|erotik|ciplak\s*foto)\p{L}*/u,
  /\bdedikodu\p{L}*\s*(yapalim|yapsana|yapmak\s*istiyorum|anlat)/u,
  /\bgiybet\p{L}*\s*(yapalim|edelim|yapmak\s*istiyorum)/u,
  /\b(rezil|ifsa|teshir)\s*(edeyim|etmek|edecegim|etmeliyim)/,
  /\b(alay|dalga)\s*(edelim|gecelim)/,
];

const GENC_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(lise|lisede|yks|lgs|universite\s*sinav|ogrenciyim|sinif\s*arkadas|dersaneye|ders\s*calis|okuldaki|hocamiz\s*odev)\p{L}*/u,
];

const BUYUK_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(torunum|torunlarim|emekliyim|emekli\s*oldum|gelinim|damadim|cocuklarim\s*evlendi)\p{L}*/u,
  /\b(altmis|yetmis|seksen)\s*(\p{L}+\s*)?yas(inda|indayim|imdayim)/u,
];

export function yalnizlastirmaTespit(mesaj: string): boolean {
  return eslesir(mesaj, YALNIZLASTIRMA_DESENLERI);
}

/** Kısa teşekkür / vedalaşma mesajı mı? (en çok 8 kelime) */
export function kapanisTespit(mesaj: string): boolean {
  const kelimeSayisi = foldTurkish(mesaj).split(" ").filter(Boolean).length;
  return kelimeSayisi > 0 && kelimeSayisi <= 8 && eslesir(mesaj, KAPANIS_DESENLERI);
}

export function gecmisYukuTespit(mesaj: string): boolean {
  return eslesir(mesaj, GECMIS_YUKU_DESENLERI);
}

export function sessizKarartmaTespit(mesaj: string): boolean {
  return eslesir(mesaj, SESSIZ_KARARTMA_DESENLERI);
}

export type Kusak = "GENC" | "BUYUK" | null;

export function kusakTespit(mesaj: string): Kusak {
  const yas = detectDeclaredAge(mesaj);
  if (yas !== null) {
    if (yas >= 55) return "BUYUK";
    if (yas >= CHILD_AGE_LIMIT && yas <= 24) return "GENC";
  }
  if (eslesir(mesaj, BUYUK_DESENLERI)) return "BUYUK";
  if (eslesir(mesaj, GENC_DESENLERI)) return "GENC";
  return null;
}
