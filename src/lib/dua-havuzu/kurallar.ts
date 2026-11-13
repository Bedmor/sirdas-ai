/**
 * Sırdaş AI - Dua Havuzu: metin kuralları (yerel, kural tabanlı; yapay zekâya gönderilmez).
 *
 * Adnan Bey'in son tarifi (13.11):
 * - Kısa dua isteği, konu/kategori seçimi yok, isimsiz.
 * - Metindeki isim, telefon, TC, adres, e-posta, sosyal medya adı yayımlanmadan gizlenir.
 * - Tek cevap düğmesi "Allah yardımcın olsun", sayaç, istek 3 gün sonra listeden düşer.
 *
 * Güvenlik: mevcut kriz/şiddet/çocuk/fetva süzgeci (src/lib/safety/triage.ts) aynen kullanılır.
 * Kriz işareti varsa istek havuza düşmez, mevcut kriz yönlendirmesi gösterilir.
 */

import { runSafetyTriage, type SafetyNotice } from "../safety/triage";
import { dogrudanKisiselVeriyiMaskele } from "../gizlilik/maskeleme";

export const DUA_EN_KISA = 10;
export const DUA_EN_UZUN = 300;
export const DUA_SURE_GUN = 3;
export const DUA_SURE_MS = DUA_SURE_GUN * 24 * 60 * 60 * 1000;
/** Aynı cihaz kimliğinden 24 saatte bırakılabilecek en fazla istek */
export const DUA_GUNLUK_SINIR = 3;
export const GIZLENDI = "[gizlendi]";

export type DuaRedSebebi =
  | "BOS"
  | "KISA"
  | "UZUN"
  | "BAGLANTI"
  | "REKLAM"
  | "KUFUR"
  | "BEDDUA"
  | "KRIZ"
  | "COCUK"
  | "SAGLIK_ACIL"
  | "FETVA"
  | "GUNLUK_SINIR"
  | "TEKRAR"
  | "COK_HIZLI";

export interface DuaRed {
  tamam: false;
  sebep: DuaRedSebebi;
  mesaj: string;
  /** Kriz, çocuk, acil sağlık veya fetva durumunda gösterilecek mevcut uyarı kutusu */
  notice?: SafetyNotice;
}

export interface DuaKabul {
  tamam: true;
  /** Yayımlanacak (kişisel bilgileri gizlenmiş) metin */
  metin: string;
  /** Metinden bir şey gizlendi mi */
  gizlendi: boolean;
}

export type DuaDenetimSonucu = DuaKabul | DuaRed;

export const DUA_RED_MESAJLARI: Record<DuaRedSebebi, string> = {
  BOS: "Lütfen dua isteğinizi yazın.",
  KISA: "Dua isteğiniz çok kısa. Lütfen birkaç kelimeyle biraz daha açık yazın.",
  UZUN: `Dua isteğiniz en fazla ${DUA_EN_UZUN} harf olabilir. Lütfen biraz kısaltın.`,
  BAGLANTI: "Dua isteğine internet bağlantısı (link) eklenemez. Lütfen bağlantıyı çıkarıp yeniden yazın.",
  REKLAM: "Bu alan yalnızca dua istekleri içindir; tanıtım ve reklam metinleri eklenemez.",
  KUFUR: "Dua isteğinde kırıcı ya da çirkin söz bulunamaz. Lütfen metninizi gözden geçirin.",
  BEDDUA: "Dua havuzunda yalnızca hayır dua istenebilir. Lütfen isteğinizi hayır dua olarak yazın.",
  KRIZ: "Yazdıklarınız bizi endişelendirdi. Bu isteğiniz havuza eklenmedi; şu an bir insandan destek almanız çok önemli. Lütfen aşağıdaki hatlardan birini arayın.",
  COCUK: "Dua havuzu büyükler için hazırlandı. Lütfen bu isteği annenle, babanla ya da güvendiğin bir büyüğünle birlikte yaz.",
  SAGLIK_ACIL: "Anlattığınız durum acil olabilir. Lütfen beklemeden 112'yi arayın. Bu isteğiniz havuza eklenmedi.",
  FETVA: "Dua havuzu yalnızca dua istekleri içindir. Dini hüküm soruları için Diyanet'in ALO 190 hattına danışabilirsiniz.",
  GUNLUK_SINIR: `Bir günde en fazla ${DUA_GUNLUK_SINIR} dua isteği bırakılabilir. Yarın yeniden bırakabilirsiniz.`,
  TEKRAR: "Bu isteği zaten bıraktınız. İsteğiniz listede duruyor.",
  COK_HIZLI: "Kısa sürede çok fazla istek gönderildi. Lütfen birkaç dakika sonra yeniden deneyin.",
};

export function red(sebep: DuaRedSebebi, notice?: SafetyNotice): DuaRed {
  return notice
    ? { tamam: false, sebep, mesaj: DUA_RED_MESAJLARI[sebep], notice }
    : { tamam: false, sebep, mesaj: DUA_RED_MESAJLARI[sebep] };
}

/** Boşlukları sadeleştirir, görünmez karakterleri atar, en fazla bir boş satır bırakır. */
export function duaMetniniSadelestir(girdi: unknown): string {
  if (typeof girdi !== "string") return "";
  return girdi
    .normalize("NFC")
    .replace(/[​-‍﻿­]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Süzgeç için sadeleştirme: ı / i ayrımı korunur ("sık sık" ile kaba sözü karıştırmamak için)
// ---------------------------------------------------------------------------

const SUZGEC_HARF: Record<string, string> = {
  ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u",
};
const SUZGEC_RAKAM: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s",
};

export function suzgecBicimleri(girdi: string): string[] {
  let sade = "";
  for (const ch of girdi.toLocaleLowerCase("tr-TR")) sade += SUZGEC_HARF[ch] ?? ch;
  sade = sade
    .replace(/[’‘'`´"“”]/g, "")
    .replace(/(?<=\p{L})[.\-_*·]+(?=\p{L})/gu, "")
    .replace(/[^\p{L}\p{N}@$\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rakamsiz = sade.replace(/[013457@$]/g, (ch, i: number, t: string) =>
    /\p{L}/u.test(t[i - 1] || "") || /\p{L}/u.test(t[i + 1] || "") ? SUZGEC_RAKAM[ch] ?? ch : ch
  );
  const sikistir = (s: string) => s.replace(/(\p{L})\1+/gu, "$1");
  return Array.from(new Set([sade, rakamsiz, sikistir(sade), sikistir(rakamsiz)]));
}

// Kelime sınırı: Türkçe harfleri de kelime sayan sınır
const S = "(?<![\\p{L}\\p{N}])";
const E = "(?![\\p{L}\\p{N}])";
const k = (govde: string) => new RegExp(`${S}(?:${govde})${E}`, "u");

const KUFUR_DESENLERI: ReadonlyArray<RegExp> = [
  k("amk|amq|aq|mk"),
  k("am[ıi]na\\s*(?:koy\\p{L}*|k\\p{L}*)"),
  // Türkçe harfsiz yazımda "sikinti" (sıkıntı), "sik sik" (sık sık) gibi masum kelimelere çarpmaması için dar tutuldu.
  k("siktir\\p{L}*|siker\\p{L}*|sikey\\p{L}*|sikim|sikik\\p{L}*"),
  k("orospu\\p{L}*|oc|pic\\p{L}*"),
  k("yar+ak\\p{L}*|dalyarak\\p{L}*"),
  k("got(?:u|un|unu|une|ten|veren\\p{L}*|lek\\p{L}*)?"),
  k("kahpe\\p{L}*|kaltak\\p{L}*|pezevenk\\p{L}*|pust\\p{L}*|ibne\\p{L}*|gavat\\p{L}*|yavsak\\p{L}*"),
  k("serefsiz\\p{L}*|haysiyetsiz\\p{L}*|namussuz\\p{L}*|gerizekal[ıi]\\p{L}*|soysuz\\p{L}*"),
  k("anan[ıi]\\s*(?:sik\\p{L}*|avrad\\p{L}*)|avrad[ıi]n[ıi]"),
];

const BEDDUA_DESENLERI: ReadonlyArray<RegExp> = [
  k("bela(?:s[ıi]n[ıi]|n[ıi]|lar[ıi]n[ıi])\\s+versin"),
  k("kahrets[ıi]n|kahrolsun|gebers[ıi]n|geberes[ıi]ce\\p{L}*|lanet\\s+olsun"),
  k("cezas[ıi]n[ıi]\\s+(?:versin|ver)|ah[ıi]m\\s+(?:tutsun|tutacak)|beddua\\p{L}*"),
  k("can[ıi]n[ıi]\\s+al(?:s[ıi]n)?|ocag[ıi]\\s+sons[uü]n|evi\\s+y[ıi]k[ıi]ls[ıi]n"),
];

const REKLAM_DESENLERI: ReadonlyArray<RegExp> = [
  k("takip\\s+(?:edin\\p{L}*|et\\p{L}*)|abone\\s+ol\\p{L}*|begen(?:i)?\\s+at\\p{L}*"),
  k("siparis\\s+(?:icin|ver\\p{L}*)|dm\\s+(?:at\\p{L}*|den|ile)|dm"),
  k("indirim\\p{L}*|kampanya\\p{L}*|promosyon\\p{L}*|kupon\\s+kod\\p{L}*|satil[ıi]k"),
  k("t[ıi]klay[ıi]n\\p{L}*|hemen\\s+ara\\p{L}*|iletisime\\s+gec\\p{L}*|bize\\s+ulas\\p{L}*|bana\\s+ulas\\p{L}*"),
  k("bahis\\s+sitesi|bonus\\p{L}*|kazanc\\s+kap\\p{L}*|para\\s+kazan(?:in|mak\\s+icin)"),
];

const BAGLANTI_DESENI =
  /(?:https?:\/\/|www\.|\b[\p{L}\d-]+\.(?:com|net|org|info|biz|tr|io|me|co|app|xyz|site|online|shop|link|ly)\b|\bt\.me\b|\bwa\.me\b|\bbit\.ly\b)/iu;

function eslesirMi(bicimler: string[], desenler: ReadonlyArray<RegExp>): boolean {
  return bicimler.some((b) => desenler.some((d) => d.test(b)));
}

// ---------------------------------------------------------------------------
// İsim ve sosyal medya adı gizleme (P3 gizlilik paketinin üstüne dua havuzuna özel katman)
// ---------------------------------------------------------------------------

/** Büyük harfle yazılsa da gizlenmeyecek dini ve genel kelimeler (küçük harf, kesme işaretinden önceki kök) */
const GIZLENMEYEN_KELIMELER = new Set([
  "allah", "allahım", "allahim", "rabbim", "rabbimiz", "rabbimizin", "rab", "rabbena", "mevla", "mevlâ",
  "mevlam", "mevlâm", "rahman", "rahim", "rahîm", "rahmân", "hak", "teala", "teâlâ", "celle", "celâlühû",
  "cenab", "cenabı", "cenâb", "ilahi", "ilâhi", "ilahî", "yarabbi", "yarabbim", "ya", "yâ",
  "kuran", "kur", "kerim", "kerîm", "peygamber", "peygamberimiz", "peygamberimizin", "resul", "resulullah",
  "resûlullah", "hz", "hazreti", "hazret", "efendimiz", "efendimizin", "sahabe",
  "kabe", "kâbe", "mekke", "medine", "kudüs", "arafat", "hac", "umre", "cennet", "cehennem", "mahşer",
  "ramazan", "kadir", "cuma", "bayram", "kandil", "regaip", "berat", "miraç", "mevlit", "aşure", "kurban",
  "besmele", "fatiha", "yasin", "yâsin", "ihlas", "ayetel", "ayetelkürsi", "amin", "âmin", "elhamdülillah",
  "inşallah", "maşallah", "bismillah", "sübhanallah", "estağfirullah", "türkiye", "ümmet", "ümmeti",
  "muhammed", "muhammedî",
]);

const OZEL_AD_ONCESI = /(?:hz\.?|hazreti|hazret-i|peygamber|efendimiz|sevgili\s+peygamberimiz)\s*$/iu;

function kok(kelime: string): string {
  return kelime.toLocaleLowerCase("tr-TR").split(/['’]/)[0];
}

function cumleBasiMi(onceki: string): boolean {
  const t = onceki.replace(/[\s"“”'‘(\[-]+$/u, "");
  return t.length === 0 || /[.!?…:;\n]$/u.test(t);
}

/**
 * Büyük harfle başlayan özel adları gizler.
 * - Cümle ortasında büyük harfle başlayan her kelime (dini istisnalar hariç) özel ad sayılır.
 * - Cümle başında ise yalnızca kesme işaretiyle ek almışsa ("Ahmet'in") özel ad sayılır.
 * - Tamamı büyük harfle yazılmış kelimeler (ANNEM, HASTA) bu kurala girmez.
 */
export function ozelAdlariGizle(metin: string): { metin: string; adet: number } {
  let adet = 0;
  const desen = /(?<![\p{L}\p{N}@])([A-ZÇĞİÖŞÜÂÎÛ][a-zçğıöşüâîû]+)((?:['’][a-zçğıöşüâîû]+)?)(?![\p{L}\p{N}])/gu;
  const sonuc = metin.replace(desen, (eslesme, govde: string, ek: string, konum: number, tum: string) => {
    const onceki = tum.slice(0, konum);
    if (GIZLENMEYEN_KELIMELER.has(kok(govde))) return eslesme;
    if (OZEL_AD_ONCESI.test(onceki)) return eslesme;
    if (cumleBasiMi(onceki) && !ek) return eslesme;
    adet++;
    return GIZLENDI;
  });
  return { metin: sonuc, adet };
}

/** Sosyal medya kullanıcı adlarını (@kullanici) gizler. */
export function sosyalMedyaAdlariniGizle(metin: string): { metin: string; adet: number } {
  let adet = 0;
  const sonuc = metin.replace(/(?<![\p{L}\p{N}])@[\p{L}\p{N}_.]{2,}/gu, () => {
    adet++;
    return GIZLENDI;
  });
  return { metin: sonuc, adet };
}

/** "adım Mehmet", "ismim Ayşe", "ben Ahmet" gibi kendini tanıtma kalıpları. */
function kendiAdiniGizle(metin: string): { metin: string; adet: number } {
  let adet = 0;
  const sonuc = metin.replace(
    /((?<![\p{L}])(?:ad[ıi]m|ism[ıi]m|benim\s+ad[ıi]m|ben)\s+)([\p{Lu}][\p{Ll}]+)(?![\p{L}])/gu,
    (eslesme, on: string, ad: string) => {
      if (GIZLENMEYEN_KELIMELER.has(kok(ad))) return eslesme;
      adet++;
      return `${on}${GIZLENDI}`;
    }
  );
  return { metin: sonuc, adet };
}

/**
 * Dua metnindeki kişisel bilgileri gizler.
 * 1) P3 gizlilik paketi (dogrudanKisiselVeriyiMaskele): e-posta, IBAN, kart, TC kimlik,
 *    telefon, açık adres.
 * 2) Dua havuzuna özel: sosyal medya adı, kendini tanıtma, büyük harfli özel adlar
 *    (akraba + isim, şehir adı dâhil).
 * Not: sanitizeIncomingUserMessage bilerek kullanılmadı; akraba kalıbı büyük/küçük harf
 * duyarsız çalıştığı için "Babam yarın..." gibi cümlelerde sonraki kelimeyi siliyor.
 * Tüm yer tutucular tek biçime ("[gizlendi]") çevrilir.
 */
export function duaMetniniMaskele(girdi: string): { metin: string; gizlendi: boolean } {
  let adet = 0;
  const sosyal = sosyalMedyaAdlariniGizle(girdi);
  adet += sosyal.adet;

  const p3 = dogrudanKisiselVeriyiMaskele(sosyal.metin);
  adet += p3.adet;
  let metin = p3.metin.replace(/\[(?:EPOSTA|IBAN|KART_NO|TC_NO|TELEFON|ADRES)\]/g, GIZLENDI);

  const kendi = kendiAdiniGizle(metin);
  adet += kendi.adet;
  const ozel = ozelAdlariGizle(kendi.metin);
  adet += ozel.adet;
  metin = ozel.metin;

  // Art arda gelen yer tutucuları teke indir ("[gizlendi] [gizlendi]" -> "[gizlendi]")
  const tekrar = new RegExp(`${GIZLENDI.replace(/[[\]]/g, "\\$&")}(?:[\\s,]+${GIZLENDI.replace(/[[\]]/g, "\\$&")})+`, "g");
  metin = metin.replace(tekrar, GIZLENDI);

  // Gizleme sonrası boşlukları yeniden sadeleştir.
  metin = duaMetniniSadelestir(metin);
  return { metin, gizlendi: adet > 0 };
}

/**
 * Dua metnini yayımlamadan önce denetler.
 * Sıra: biçim (boş/kısa/uzun) -> güvenlik süzgeci (kriz önce) -> bağlantı -> küfür -> beddua -> reklam -> gizleme.
 * Not: Hepsi yerel kuraldır; hiçbir model çağrısı yapılmaz.
 */
export function duaMetniniDenetle(ham: unknown): DuaDenetimSonucu {
  const metin = duaMetniniSadelestir(ham);
  if (!metin) return red("BOS");
  if ([...metin].length > DUA_EN_UZUN) return red("UZUN");

  // Güvenlik süzgeci maskelenmemiş metinle çalışır (P3 kuralı).
  const triyaj = runSafetyTriage(metin);
  if (triyaj) {
    switch (triyaj.category) {
      case "CRISIS_SELF_HARM":
      case "ABUSE_VICTIM":
      case "HARM_TO_OTHERS":
        return red("KRIZ", triyaj.notice);
      case "CHILD_AGE":
      case "CHILD_WITH_HEALTH":
        return red("COCUK", triyaj.notice);
      case "PHYSICAL_HEALTH_SEVERE":
        return red("SAGLIK_ACIL", triyaj.notice);
      case "FATWA_LIMIT":
        return red("FETVA", triyaj.notice);
      case "PHYSICAL_HEALTH":
        // Hastalar için şifa duası istemek dua havuzunun asıl amacıdır; havuza alınır.
        break;
    }
  }

  const harfSayisi = metin.replace(/[^\p{L}]/gu, "").length;
  if (harfSayisi < DUA_EN_KISA) return red("KISA");

  // E-posta adresi bağlantı sayılmaz (aşağıda gizlenir).
  if (BAGLANTI_DESENI.test(metin.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, " "))) {
    return red("BAGLANTI");
  }

  const bicimler = suzgecBicimleri(metin);
  if (eslesirMi(bicimler, KUFUR_DESENLERI)) return red("KUFUR");
  if (eslesirMi(bicimler, BEDDUA_DESENLERI)) return red("BEDDUA");
  if (eslesirMi(bicimler, REKLAM_DESENLERI)) return red("REKLAM");

  const gizli = duaMetniniMaskele(metin);
  return { tamam: true, metin: gizli.metin, gizlendi: gizli.gizlendi };
}
