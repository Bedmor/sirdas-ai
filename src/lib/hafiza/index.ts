/**
 * Sırdaş AI - P4 hafıza paketi (Esnaf emaneti, esnek hal hafızası, oturum bağlamı).
 *
 * Kaynak: Adnan Bey 12.11 maili ("SİSTEME DAHİL EDİLECEKLER": Esnaf Emaneti,
 * Esnek Hal Hafızası; "SİSTEM HATALARI VE ÇÖZÜM VE YAMALARI": User State Cache), iş planı P4.
 *
 * İlkeler:
 * - Veri yalnızca kullanıcının cihazında (localStorage) tutulur; veritabanına yeni alan/tablo yok.
 * - Emanet yalnızca kullanıcının kendi eliyle eklediği kısa bilgilerdir; görür, düzeltir, siler.
 * - Hassas bilgi (sağlık teşhisi, TC, telefon, adres, IBAN, kart, e-posta) emanete yazılmaz.
 * - Hal hafızası tek bir konu etiketi tutar (mesaj metni değil); kriz ve yas konuları hiç hatırlatılmaz.
 * - "Bunu açma" denen konu bir daha açılmaz. Hafıza kapalıyken hiçbir şey hatırlanmaz.
 * - Tüm fonksiyonlar saftır; model çağrısı, ağ veya veritabanı kullanmaz.
 */
import {
  buildMatchVariants,
  runSafetyTriage,
  type SafetyCategory,
} from "../safety/triage";
import { dogrudanKisiselVeriyiMaskele } from "../gizlilik/maskeleme";

export const HAFIZA_STORAGE_KEY = "sirdas_hafiza_v1";

export const EMANET_EN_FAZLA = 8;
export const EMANET_EN_UZUN = 80;
/** Hal hatırlatması için en az geçmesi gereken süre (saat) */
export const HAL_EN_AZ_SAAT = 20;
/** Bu süreden eski hal notu hatırlatılmaz (gün) */
export const HAL_EN_COK_GUN = 14;

// ---------------------------------------------------------------------------
// Türler
// ---------------------------------------------------------------------------

export type EmanetTuru = "HITAP" | "KONU" | "ZIKIR" | "NOT";

export const EMANET_TURU_ETIKET: Record<EmanetTuru, string> = {
  HITAP: "Bana nasıl hitap edilsin",
  KONU: "Derdimin genel konusu",
  ZIKIR: "Sevdiğim zikir veya dua",
  NOT: "Hatırlanmasını istediğim not",
};

export interface Emanet {
  id: string;
  tur: EmanetTuru;
  metin: string;
  /** ISO tarih */
  eklenme: string;
}

export type HalKonusu =
  | "SINAV"
  | "IS"
  | "BORC"
  | "EVLILIK"
  | "AILE"
  | "YALNIZLIK"
  | "KARAR";

export const HAL_KONU_ETIKET: Record<HalKonusu, string> = {
  SINAV: "sınav kaygısı",
  IS: "iş ve geçim derdi",
  BORC: "borç sıkıntısı",
  EVLILIK: "evlilik meselesi",
  AILE: "aile içindeki bir kırgınlık",
  YALNIZLIK: "yalnızlık hissi",
  KARAR: "verilecek bir karar",
};

export interface HalNotu {
  /** Konu etiketi; kriz izinde null */
  konu: HalKonusu | null;
  /** ISO tarih */
  tarih: string;
  sohbetId: string;
  /** Bu sohbette kriz/güvenlik işareti görüldüyse true: hiç hatırlatılmaz */
  kriz: boolean;
  /** Bir kez hatırlatıldıysa true: ısrar edilmez */
  hatirlatildi: boolean;
}

export interface HafizaDurumu {
  surum: 1;
  /** Kapalıysa hiçbir şey hatırlanmaz ve modele gönderilmez */
  acik: boolean;
  emanetler: Emanet[];
  sonHal: HalNotu | null;
  /** Kullanıcının "bunu açma" dediği konular */
  acilmayacak: HalKonusu[];
}

export const BOS_HAFIZA: HafizaDurumu = {
  surum: 1,
  acik: true,
  emanetler: [],
  sonHal: null,
  acilmayacak: [],
};

/** Sunucuya giden paket (cihazdaki durumdan türetilir) */
export interface HafizaPaketi {
  acik: boolean;
  emanetler: Array<{ tur: EmanetTuru; metin: string }>;
  halHatirlatma: { konu: HalKonusu; gunOnce: number; kendisiActi?: boolean } | null;
  acilmayacak: HalKonusu[];
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const EMANET_TURLERI: readonly EmanetTuru[] = ["HITAP", "KONU", "ZIKIR", "NOT"];
const HAL_KONULARI = Object.keys(HAL_KONU_ETIKET) as HalKonusu[];

function eslesir(metin: string, desenler: ReadonlyArray<RegExp>): boolean {
  const varyantlar = buildMatchVariants(metin);
  return desenler.some((d) => varyantlar.some((v) => d.test(v)));
}

/** Kriz, istismar, zarar, çocuk ve sağlık işaretleri: hafıza bu mesajlarda geri çekilir */
const GUVENLIK_KATEGORILERI: ReadonlySet<SafetyCategory> = new Set<SafetyCategory>([
  "CRISIS_SELF_HARM",
  "ABUSE_VICTIM",
  "HARM_TO_OTHERS",
  "CHILD_WITH_HEALTH",
  "PHYSICAL_HEALTH_SEVERE",
  "CHILD_AGE",
  "PHYSICAL_HEALTH",
]);

export function guvenlikIsaretiVar(mesaj: string): boolean {
  const t = runSafetyTriage(mesaj);
  return Boolean(t && GUVENLIK_KATEGORILERI.has(t.category));
}

function kimlikUret(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `emanet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Görünmez karakterleri ve satır sonlarını temizler, boşlukları sadeleştirir. */
export function emanetMetniSadelestir(metin: string): string {
  return (metin || "")
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 1. Esnaf emaneti: hassas bilgi denetimi ve ekle / düzelt / sil
// ---------------------------------------------------------------------------

/** Sağlık teşhisi ve tedavi bilgisi (emanete yazılmaz) */
const SAGLIK_DESENLERI: ReadonlyArray<RegExp> = [
  /\bteshis/,
  /\btani(?:si|sı|m|mi|n|niz|ladi|landim|konul\w*)?\b/,
  /\b(?:kanser|tumor|losemi|diyabet|insulin|seker hastal\w*|tansiyon|kalp yetmez\w*|kalp krizi|inme|felc|epilepsi|sara hastal\w*|hiv|aids|hepatit|alzheimer|demans|parkinson|ms hastal\w*|astim|koah|bobrek yetmez\w*|diyaliz)/,
  /\b(?:depresyon|anksiyete|panik atak|bipolar|sizofreni|okb|obsesif|travma sonrasi|tssb|dehb|otizm|yeme bozuklug\w*|psikoz)/,
  /\b(?:ilac\w*|antidepresan\w*|hap\w* kullan\w*|recete\w*|ameliyat\w*|kemoterapi|radyoterapi|tedavi gor\w*|psikiyatri\w*|hastane\w*|hastalig\w*|hastaligim|hastayim)/,
];

/** Tek başına bile adres sayılan parçalar (maskeleme modülü zincir arar, emanet daha sıkıdır) */
const ADRES_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(?:adres\w*|mahalle\w*|mah\.|sokak\w*|sok\.|sk\.|cadde\w*|cad\.|bulvar\w*|apartman\w*|apt\.?|daire\s*\d|kat\s*:?\s*\d|no\s*:?\s*\d|posta kodu)/,
];

/** Kimlik ve iletişim numarası işaretleri (maskeleme kaçırırsa diye ikinci kat) */
const KIMLIK_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(?:tc|t\.c\.|kimlik)\s*(?:no|numara\w*)?\s*:?\s*\d/,
  /\b(?:sifre\w*|parola\w*|iban|kart numara\w*)/,
  /\d{7,}/,
];

export type EmanetRedSebebi = "BOS" | "UZUN" | "KISISEL_VERI" | "SAGLIK" | "GUVENLIK" | "TUR";

export interface EmanetDenetimi {
  kabul: boolean;
  metin: string;
  sebep?: EmanetRedSebebi;
}

export const EMANET_RED_MESAJI: Record<EmanetRedSebebi, string> = {
  BOS: "Lütfen en az iki harflik bir şey yazın.",
  UZUN: `Emanet en fazla ${EMANET_EN_UZUN} harf olabilir. Biraz kısaltır mısınız?`,
  KISISEL_VERI:
    "Bu bilgi emanete yazılmadı. Kimlik numarası, telefon, adres, banka ve e-posta bilgileri burada tutulmaz.",
  SAGLIK:
    "Bu bilgi emanete yazılmadı. Hastalık, teşhis ve ilaç gibi sağlık bilgileri burada tutulmaz.",
  GUVENLIK:
    "Bu bilgi emanete yazılmadı. Zor bir an yaşıyorsanız 112 veya ALO 183'ü arayabilirsiniz.",
  TUR: "Emanet türü tanınmadı.",
};

/** Emanete yazılacak metni denetler. Hassas bilgi varsa reddeder. */
export function emanetDenetle(hamMetin: string): EmanetDenetimi {
  const metin = emanetMetniSadelestir(hamMetin);
  if (metin.length < 2) return { kabul: false, metin, sebep: "BOS" };
  if (metin.length > EMANET_EN_UZUN) return { kabul: false, metin, sebep: "UZUN" };
  if (guvenlikIsaretiVar(metin)) return { kabul: false, metin, sebep: "GUVENLIK" };
  if (dogrudanKisiselVeriyiMaskele(metin).adet > 0) {
    return { kabul: false, metin, sebep: "KISISEL_VERI" };
  }
  if (eslesir(metin, ADRES_DESENLERI) || eslesir(metin, KIMLIK_DESENLERI)) {
    return { kabul: false, metin, sebep: "KISISEL_VERI" };
  }
  if (eslesir(metin, SAGLIK_DESENLERI)) return { kabul: false, metin, sebep: "SAGLIK" };
  return { kabul: true, metin };
}

export interface HafizaIslemSonucu {
  durum: HafizaDurumu;
  hata?: string;
}

export function emanetEkle(
  durum: HafizaDurumu,
  tur: EmanetTuru,
  hamMetin: string,
  simdi: Date = new Date(),
  idUret: () => string = kimlikUret
): HafizaIslemSonucu {
  if (!EMANET_TURLERI.includes(tur)) return { durum, hata: EMANET_RED_MESAJI.TUR };
  if (!durum.acik) {
    return { durum, hata: "Hafıza kapalıyken yeni emanet eklenmez. Önce hafızayı açın." };
  }
  const d = emanetDenetle(hamMetin);
  if (!d.kabul) return { durum, hata: EMANET_RED_MESAJI[d.sebep ?? "BOS"] };

  // Hitap tektir: yenisi eskisinin yerine geçer
  const kalan = tur === "HITAP" ? durum.emanetler.filter((e) => e.tur !== "HITAP") : durum.emanetler;
  if (kalan.length >= EMANET_EN_FAZLA) {
    return {
      durum,
      hata: `En fazla ${EMANET_EN_FAZLA} emanet tutulur. Yeni eklemek için birini silebilirsiniz.`,
    };
  }
  const yeni: Emanet = { id: idUret(), tur, metin: d.metin, eklenme: simdi.toISOString() };
  return { durum: { ...durum, emanetler: [...kalan, yeni] } };
}

export function emanetDuzelt(durum: HafizaDurumu, id: string, hamMetin: string): HafizaIslemSonucu {
  const hedef = durum.emanetler.find((e) => e.id === id);
  if (!hedef) return { durum, hata: "Bu emanet bulunamadı." };
  const d = emanetDenetle(hamMetin);
  if (!d.kabul) return { durum, hata: EMANET_RED_MESAJI[d.sebep ?? "BOS"] };
  return {
    durum: {
      ...durum,
      emanetler: durum.emanetler.map((e) => (e.id === id ? { ...e, metin: d.metin } : e)),
    },
  };
}

export function emanetSil(durum: HafizaDurumu, id: string): HafizaDurumu {
  return { ...durum, emanetler: durum.emanetler.filter((e) => e.id !== id) };
}

/**
 * Hafızayı açar/kapatır. Kapatınca hal notu ve "açma" listesi dışındaki her şey
 * kullanılmaz; son hal notu silinir. Emanetler kullanıcı silene kadar cihazda kalır
 * ama kapalıyken hiçbir yere gönderilmez.
 */
export function hafizaAcKapat(durum: HafizaDurumu, acik: boolean): HafizaDurumu {
  return acik ? { ...durum, acik: true } : { ...durum, acik: false, sonHal: null };
}

/** Emanetler, hal notu ve "açma" listesi dahil her şeyi siler (hafıza ayarı korunur). */
export function hafizayiTemizle(durum: HafizaDurumu): HafizaDurumu {
  return { ...BOS_HAFIZA, acik: durum.acik };
}

// ---------------------------------------------------------------------------
// 2. Esnek hal hafızası (günler arası zarafet)
// ---------------------------------------------------------------------------

/** Sıra önemlidir: ilk eşleşen konu alınır. Yas ve sağlık bilerek listede yoktur. */
const HAL_KONU_DESENLERI: ReadonlyArray<[HalKonusu, RegExp]> = [
  ["SINAV", /\b(?:sinav\w*|yks|kpss|lgs|ales|yds|tus|final\w*|vize haftas\w*)\b/],
  ["BORC", /\b(?:borc\w*|kredi kart\w*|icra\w*|haciz\w*|taksit\w*)/],
  ["IS", /\b(?:isten|issiz\w*|is yerinde|isyerinde|isyeri\w*|is ariyorum|patron\w*|maas\w*|gecim\w*|rizik\w*|kovul\w*|mesai\w*)/],
  ["EVLILIK", /\b(?:esim(?:le|den|e|i|in)?|evlilig\w*|evlilik|nisanli\w*|bosan\w*|kocam\w*|karim\w*)\b/],
  ["AILE", /\b(?:annem\w*|babam\w*|kardesim\w*|kayinvalide\w*|kaynana\w*|ailem\w*|cocugum\w*|oglum\w*|kizim(?:la|dan|a|i|in)?)\b/],
  ["YALNIZLIK", /\b(?:yalniz\w*|kimsem yok|kimsesiz\w*)/],
  ["KARAR", /\b(?:karar veremiyorum|kararsiz\w*|istihare\w*|ne yapacagimi bilmiyorum)/],
];

/** Yas ve kayıp: eski acı açılmasın diye bu mesajlardan hal notu çıkarılmaz */
const YAS_DESENI = /\b(?:vefat\w*|kaybettim|kaybettik|kaybimiz\w*|rahmetli\w*|oldu gitti|cenaze\w*|taziye\w*|yas tutuyorum)/;

/** Mesajdan tek bir genel konu etiketi çıkarır (mesaj metni saklanmaz). */
export function halKonusuBul(mesaj: string): HalKonusu | null {
  const varyantlar = buildMatchVariants(mesaj);
  if (varyantlar.some((v) => YAS_DESENI.test(v))) return null;
  for (const [konu, desen] of HAL_KONU_DESENLERI) {
    if (varyantlar.some((v) => desen.test(v))) return konu;
  }
  return null;
}

/** Kullanıcı bir konunun açılmamasını istiyor mu */
const ACMA_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(?:bunu|bu konuyu|o konuyu|onu|bundan|ondan)\s+(?:bir daha\s+)?(?:acma|acmayalim|acmayin|acmasan|sorma|sormayin|sormayalim|hatirlatma|hatirlatmayin|bahsetme|bahsetmeyin|konusmayalim)\b/,
  /\bbir daha\s+(?:sorma|acma|hatirlatma|bahsetme)\b/,
  /\b(?:o|bu) konu(?:yu)?\s+kapan\w*/,
  /\bkonusmak istemiyorum\b/,
];

export function acmaIstegiVar(mesaj: string): boolean {
  return eslesir(mesaj, ACMA_DESENLERI);
}

/** Kullanıcı kendisi önceki sohbete atıf yapıyor mu ("geçen sefer konuşmuştuk ya") */
const ATIF_DESENLERI: ReadonlyArray<RegExp> = [
  /\b(?:gecen (?:sefer|gun|hafta)|dun|evvelsi gun|gecenlerde|daha once)\b.*\b(?:konusmus\w*|bahsetmis\w*|anlatmis\w*|soylemis\w*|demistim|yazmistim)/,
  /\bhatirliyor mu(?:sun|sunuz)\b/,
];

export function oncekiSohbeteAtifVar(mesaj: string): boolean {
  return eslesir(mesaj, ATIF_DESENLERI);
}

export interface HalGuncelleGirdisi {
  mesaj: string;
  sohbetId: string;
  simdi?: Date;
}

/**
 * Kullanıcının gönderdiği her mesajdan sonra hal notunu günceller.
 * - Hafıza kapalıysa hiçbir şey kaydedilmez.
 * - "Bunu açma" denirse son konu açılmayacaklar listesine girer, hal notu silinir.
 * - Kriz/güvenlik işareti olan sohbet "kriz izi" alır; o sohbetten sonra hiçbir şey hatırlatılmaz.
 */
export function halGuncelle(durum: HafizaDurumu, girdi: HalGuncelleGirdisi): HafizaDurumu {
  if (!durum.acik) return durum.sonHal ? { ...durum, sonHal: null } : durum;
  const simdi = (girdi.simdi ?? new Date()).toISOString();
  const onceki = durum.sonHal;
  const ayniSohbet = onceki?.sohbetId === girdi.sohbetId;

  if (acmaIstegiVar(girdi.mesaj)) {
    const kapatilacak = new Set<HalKonusu>(durum.acilmayacak);
    if (onceki?.konu) kapatilacak.add(onceki.konu);
    const buMesajKonusu = halKonusuBul(girdi.mesaj);
    if (buMesajKonusu) kapatilacak.add(buMesajKonusu);
    return { ...durum, sonHal: null, acilmayacak: Array.from(kapatilacak) };
  }

  if (guvenlikIsaretiVar(girdi.mesaj) || (ayniSohbet && onceki?.kriz)) {
    return {
      ...durum,
      sonHal: { konu: null, tarih: simdi, sohbetId: girdi.sohbetId, kriz: true, hatirlatildi: true },
    };
  }

  const konu = halKonusuBul(girdi.mesaj);
  if (!konu || durum.acilmayacak.includes(konu)) return durum;
  if (ayniSohbet && onceki?.konu === konu) {
    return { ...durum, sonHal: { ...onceki, tarih: simdi } };
  }
  return {
    ...durum,
    sonHal: { konu, tarih: simdi, sohbetId: girdi.sohbetId, kriz: false, hatirlatildi: false },
  };
}

export interface HatirlatmaGirdisi {
  mesaj: string;
  /** Yeni bir sohbetin ilk mesajı mı */
  ilkMesaj: boolean;
  sohbetId: string;
  simdi?: Date;
}

/** Bu mesajla birlikte modele hal hatırlatması gönderilmeli mi; gönderilecekse konu ve gün. */
export function halHatirlatmasiSec(
  durum: HafizaDurumu,
  girdi: HatirlatmaGirdisi
): HafizaPaketi["halHatirlatma"] {
  const hal = durum.sonHal;
  if (!durum.acik || !hal || hal.kriz || !hal.konu) return null;
  if (durum.acilmayacak.includes(hal.konu)) return null;
  if (hal.sohbetId === girdi.sohbetId) return null;
  if (guvenlikIsaretiVar(girdi.mesaj) || acmaIstegiVar(girdi.mesaj)) return null;

  const gecen = (girdi.simdi ?? new Date()).getTime() - new Date(hal.tarih).getTime();
  if (!Number.isFinite(gecen) || gecen < 0) return null;
  const saat = gecen / 3_600_000;
  if (saat > HAL_EN_COK_GUN * 24) return null;
  const gunOnce = Math.max(1, Math.round(saat / 24));

  // Kullanıcı kendisi açarsa (ör. "geçen sefer konuşmuştuk ya") süre ve tek-sefer sınırı aranmaz
  if (oncekiSohbeteAtifVar(girdi.mesaj)) return { konu: hal.konu, gunOnce, kendisiActi: true };

  if (!girdi.ilkMesaj || hal.hatirlatildi || saat < HAL_EN_AZ_SAAT) return null;
  return { konu: hal.konu, gunOnce };
}

/** Hatırlatma gönderildikten sonra işaretler: aynı konu ikinci kez hatırlatılmaz. */
export function hatirlatildiIsaretle(durum: HafizaDurumu): HafizaDurumu {
  if (!durum.sonHal) return durum;
  return { ...durum, sonHal: { ...durum.sonHal, hatirlatildi: true } };
}

/** Cihazdaki durumdan sunucuya gidecek paketi hazırlar. */
export function hafizaPaketiHazirla(durum: HafizaDurumu, girdi: HatirlatmaGirdisi): HafizaPaketi {
  if (!durum.acik) return { acik: false, emanetler: [], halHatirlatma: null, acilmayacak: [] };
  return {
    acik: true,
    emanetler: durum.emanetler.map((e) => ({ tur: e.tur, metin: e.metin })),
    halHatirlatma: halHatirlatmasiSec(durum, girdi),
    acilmayacak: [...durum.acilmayacak],
  };
}

// ---------------------------------------------------------------------------
// Cihaz deposu (localStorage) okuma / yazma
// ---------------------------------------------------------------------------

export interface HafizaDeposu {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function halNotuGecerli(h: unknown): h is HalNotu {
  if (!h || typeof h !== "object") return false;
  const x = h as Record<string, unknown>;
  return (
    (x.konu === null || HAL_KONULARI.includes(x.konu as HalKonusu)) &&
    typeof x.tarih === "string" &&
    typeof x.sohbetId === "string" &&
    typeof x.kriz === "boolean" &&
    typeof x.hatirlatildi === "boolean"
  );
}

/** Depodaki ham veriyi doğrular; bozuk kayıtları atar. */
export function hafizaCoz(ham: string | null): HafizaDurumu {
  if (!ham) return { ...BOS_HAFIZA };
  try {
    const x = JSON.parse(ham) as Record<string, unknown>;
    if (!x || typeof x !== "object") return { ...BOS_HAFIZA };
    const emanetler = Array.isArray(x.emanetler)
      ? (x.emanetler as unknown[])
          .filter(
            (e): e is Emanet =>
              Boolean(e) &&
              typeof e === "object" &&
              typeof (e as Emanet).id === "string" &&
              EMANET_TURLERI.includes((e as Emanet).tur) &&
              typeof (e as Emanet).metin === "string" &&
              typeof (e as Emanet).eklenme === "string"
          )
          .filter((e) => emanetDenetle(e.metin).kabul)
          .slice(0, EMANET_EN_FAZLA)
      : [];
    const acilmayacak = Array.isArray(x.acilmayacak)
      ? (x.acilmayacak as unknown[]).filter((k): k is HalKonusu => HAL_KONULARI.includes(k as HalKonusu))
      : [];
    return {
      surum: 1,
      acik: x.acik !== false,
      emanetler,
      sonHal: halNotuGecerli(x.sonHal) ? x.sonHal : null,
      acilmayacak,
    };
  } catch {
    return { ...BOS_HAFIZA };
  }
}

export function hafizaOku(depo: HafizaDeposu): HafizaDurumu {
  try {
    return hafizaCoz(depo.getItem(HAFIZA_STORAGE_KEY));
  } catch {
    return { ...BOS_HAFIZA };
  }
}

export function hafizaYaz(depo: HafizaDeposu, durum: HafizaDurumu): void {
  try {
    depo.setItem(HAFIZA_STORAGE_KEY, JSON.stringify(durum));
  } catch {}
}

export function hafizaSil(depo: HafizaDeposu): void {
  try {
    depo.removeItem(HAFIZA_STORAGE_KEY);
  } catch {}
}
