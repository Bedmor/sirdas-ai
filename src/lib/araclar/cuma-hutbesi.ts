/**
 * Cuma hutbesi: Diyanet İşleri Başkanlığı Din Hizmetleri Genel Müdürlüğü'nün
 * resmi hutbe listesini ve hutbe PDF'lerini ayrıştıran saf fonksiyonlar.
 * Ağ isteği yoktur (bkz. cuma-hutbesi-kaynak.ts); testler gerçek sayfadan
 * kaydedilmiş örneklerle çalışır.
 *
 * Metin değiştirilmez, kısaltılmaz, yapay zekâdan geçirilmez. PDF'teki satırlar
 * yalnızca paragraflara birleştirilir; dipnot numaraları üst simge olarak korunur.
 */

export const DIYANET_KOK = "https://dinhizmetleri.diyanet.gov.tr";
export const HUTBE_LISTE_ADRESI = `${DIYANET_KOK}/kategoriler/yayinlarimiz/hutbeler/t%C3%BCrk%C3%A7e`;
export const KAYNAK_ADI = "Diyanet İşleri Başkanlığı";

/** Gösterilecek hutbe sayısı: bu haftanınki + önceki 4 cuma. */
export const GOSTERILECEK_HUTBE = 5;

export type HutbeKaydi = {
  /** ISO tarih (YYYY-AA-GG) */
  tarih: string;
  baslik: string;
  pdf: string | null;
  word: string | null;
  ses: string | null;
};

export type HutbeParagrafi = { tur: "hitap" | "metin" | "imza"; metin: string };
export type HutbeDipnotu = { no: string; metin: string };
export type HutbeMetni = {
  paragraflar: HutbeParagrafi[];
  dipnotlar: HutbeDipnotu[];
  /**
   * PDF'teki Arapça ayet/hadis metni, harekeleri metin olarak bozulmadan
   * çıkarılamadığı için gösterilmez; sayfada PDF'e bakılması söylenir.
   */
  arapcaAtlandi: boolean;
};

export type Hutbe = HutbeKaydi & { metin: HutbeMetni | null };

/* ------------------------------------------------------------------ */
/* Liste sayfası                                                       */
/* ------------------------------------------------------------------ */

const ADLI_VARLIKLAR: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function htmlVarliklariniCoz(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tam, ad: string) => {
    if (ad[0] === "#") {
      const kod = ad[1] === "x" || ad[1] === "X" ? parseInt(ad.slice(2), 16) : parseInt(ad.slice(1), 10);
      return Number.isFinite(kod) && kod > 0 && kod < 0x110000 ? String.fromCodePoint(kod) : tam;
    }
    return ADLI_VARLIKLAR[ad.toLowerCase()] ?? tam;
  });
}

/** "13.11.2026" -> "2026-11-13"; geçersizse null. */
export function noktaliTarihiCoz(s: string): string | null {
  const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(s);
  if (!m) return null;
  const gun = Number(m[1]);
  const ay = Number(m[2]);
  const yil = Number(m[3]);
  const d = new Date(Date.UTC(yil, ay - 1, gun));
  if (d.getUTCFullYear() !== yil || d.getUTCMonth() !== ay - 1 || d.getUTCDate() !== gun) return null;
  return `${m[3]}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

/** ISO tarihin haftanın günü (0 pazar ... 5 cuma). Takvim günüdür, saat dilimi yoktur. */
export function isoHaftaGunu(iso: string): number {
  const [y, a, g] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, a - 1, g)).getUTCDay();
}

/** Liste sayfasındaki "/Documents/..." yolunu yalnız Diyanet alan adında tam adrese çevirir. */
export function diyanetAdresi(yol: unknown): string | null {
  if (typeof yol !== "string" || !yol.trim()) return null;
  try {
    const u = new URL(yol.trim(), DIYANET_KOK);
    if (u.protocol !== "https:" || u.hostname !== new URL(DIYANET_KOK).hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * SharePoint liste sayfasının içine gömülü `var WPQ1ListData = {...};` nesnesini
 * bulur. Dizgelerin içindeki parantezleri sayan küçük bir tarayıcıyla nesnenin
 * sonunu belirler, sonra JSON olarak okur.
 */
function gomuluListeVerisi(html: string): unknown {
  const bas = /var\s+WPQ\d+ListData\s*=\s*\{/.exec(html);
  if (!bas) throw new Error("Hutbe listesi verisi sayfada bulunamadı");
  const ilk = bas.index + bas[0].length - 1;
  let derinlik = 0;
  let dizgede = false;
  let kacis = false;
  for (let i = ilk; i < html.length; i++) {
    const c = html[i];
    if (dizgede) {
      if (kacis) kacis = false;
      else if (c === "\\") kacis = true;
      else if (c === '"') dizgede = false;
      continue;
    }
    if (c === '"') dizgede = true;
    else if (c === "{") derinlik++;
    else if (c === "}") {
      derinlik--;
      if (derinlik === 0) return JSON.parse(html.slice(ilk, i + 1));
    }
  }
  throw new Error("Hutbe listesi verisi yarım");
}

/** Liste sayfasından tüm hutbe kayıtlarını (tarih sırası: yeniden eskiye) çıkarır. */
export function hutbeListesiniAyristir(html: string): HutbeKaydi[] {
  const veri = gomuluListeVerisi(html) as { Row?: unknown };
  if (!veri || !Array.isArray(veri.Row)) throw new Error("Hutbe listesi biçimi beklenenden farklı");
  const kayitlar: HutbeKaydi[] = [];
  for (const satir of veri.Row as Record<string, unknown>[]) {
    if (!satir || typeof satir !== "object") continue;
    const tarih = typeof satir.Tarih === "string" ? noktaliTarihiCoz(satir.Tarih) : null;
    const baslik = typeof satir.Title === "string" ? htmlVarliklariniCoz(satir.Title).replace(/\s+/g, " ").trim() : "";
    if (!tarih || !baslik) continue;
    kayitlar.push({
      tarih,
      baslik,
      pdf: diyanetAdresi(satir.PDF),
      word: diyanetAdresi(satir.Word),
      ses: diyanetAdresi(satir.Ses),
    });
  }
  if (!kayitlar.length) throw new Error("Hutbe listesi boş");
  return kayitlar.sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));
}

/**
 * Yalnız cuma tarihli hutbeler (bayram hutbeleri başka günlere düşer), bugünden
 * (Türkiye takvimi) ileri tarihli olanlar hariç, yeniden eskiye, her cuma için
 * bir hutbe, en fazla `adet` tane.
 */
export function cumaHutbeleriniSec<T extends { tarih: string }>(kayitlar: T[], bugunIso: string, adet = GOSTERILECEK_HUTBE): T[] {
  const gorulen = new Set<string>();
  return [...kayitlar]
    .filter((k) => isoHaftaGunu(k.tarih) === 5 && k.tarih <= bugunIso)
    .sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0))
    .filter((k) => (gorulen.has(k.tarih) ? false : (gorulen.add(k.tarih), true)))
    .slice(0, adet);
}

/** Türkiye takvimine (Europe/Istanbul) göre bugünün ISO tarihi. */
export function turkiyeBugunIso(an: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(an);
  const al = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${al("year")}-${al("month")}-${al("day")}`;
}

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2026-11-13" -> "13 Kasım 2026" */
export function tarihiYaz(iso: string): string {
  const [y, a, g] = iso.split("-").map(Number);
  return `${g} ${AYLAR[a - 1]} ${y}`;
}

/* ------------------------------------------------------------------ */
/* PDF metni                                                           */
/* ------------------------------------------------------------------ */

/** pdf.js getTextContent() öğesinin kullandığımız kısmı. */
export type PdfMetinOgesi = { str: string; transform: number[]; height: number };
export type PdfSayfasi = { genislik: number; ogeler: PdfMetinOgesi[] };

const UST_SIMGE: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};
const ustSimge = (s: string) => s.replace(/\d/g, (d) => UST_SIMGE[d]);

type Satir = { y: number; x: number; t: string; sutun: number; sayfa: number };

function govdeYuksekligi(sayfalar: PdfSayfasi[]): number {
  const sayim = new Map<number, number>();
  for (const s of sayfalar)
    for (const o of s.ogeler)
      if (o.str.trim().length >= 3 && o.height > 0) {
        const h = Math.round(o.height);
        sayim.set(h, (sayim.get(h) ?? 0) + o.str.trim().length);
      }
  let en = 0;
  let enSayi = -1;
  for (const [h, n] of sayim) if (n > enSayi) [en, enSayi] = [h, n];
  return en || 12;
}

/**
 * PDF metin öğelerini paragraflara çevirir.
 * - Satırlar y konumundan, sütunlar sayfanın ortasına göre ayrılır.
 * - Sütunun sol kenarından içeride başlayan satır yeni paragraftır (hutbelerde
 *   her paragraf ve her hitap girintiyle başlar).
 * - Gövdeden küçük, satırla aynı hizada yükseltilmiş rakamlar dipnot işaretidir;
 *   satır dışında duran küçük rakamlar dipnot bölümünü başlatır.
 * - "Tarih: ..." üst bilgisi ve büyük harfli başlık satırı (başlık ayrıca
 *   gösterildiği için) atlanır. Metnin kendisine dokunulmaz.
 * Güvenilir bir metin çıkmazsa null döner; o zaman yalnız PDF bağlantısı gösterilir.
 */
export function pdfMetniniAyristir(sayfalar: PdfSayfasi[]): HutbeMetni | null {
  const H = govdeYuksekligi(sayfalar);
  const satirlar: Satir[] = [];
  const dipnotlar: HutbeDipnotu[] = [];

  sayfalar.forEach((sayfa, sayfaNo) => {
    let cur: Satir | null = null;
    let dipnotta = false;
    let dipnotY = Number.NaN;
    for (const o of sayfa.ogeler) {
      const str = o.str ?? "";
      const yalin = str.trim();
      const x = o.transform?.[4] ?? 0;
      const y = o.transform?.[5] ?? 0;
      if (!yalin) {
        if (str && cur && !dipnotta) cur.t += " ";
        else if (str && dipnotta && dipnotlar.length) dipnotlar[dipnotlar.length - 1].metin += " ";
        continue;
      }
      const kucuk = o.height > 0 && o.height < H * 0.9;
      const rakam = /^\d{1,2}$/.test(yalin);
      if (kucuk && rakam && cur && !dipnotta && Math.abs(y - cur.y) <= H * 0.6) {
        cur.t += ustSimge(yalin) + (/\s$/.test(str) ? " " : "");
        continue;
      }
      // Dipnot içinde aynı satırdaki rakam (ör. "Edeb, 80") yeni dipnot değildir.
      if (kucuk && rakam && !(dipnotta && Math.abs(y - dipnotY) <= 1)) {
        dipnotta = true;
        cur = null;
        dipnotY = Number.NaN;
        dipnotlar.push({ no: yalin, metin: "" });
        continue;
      }
      if (kucuk && dipnotta) {
        const d = dipnotlar[dipnotlar.length - 1];
        const yeniSatir = d.metin && !Number.isNaN(dipnotY) && Math.abs(y - dipnotY) > 1;
        d.metin += (yeniSatir && !/\s$/.test(d.metin) ? " " : "") + str;
        dipnotY = y;
        continue;
      }
      dipnotta = false;
      if (!cur || Math.abs(y - cur.y) > H * 0.5) {
        cur = { y, x, t: str, sutun: x < sayfa.genislik / 2 ? 0 : 1, sayfa: sayfaNo };
        satirlar.push(cur);
      } else {
        cur.t += str;
      }
    }
  });

  // Her sayfa ve sütun için sol kenar
  const solKenar = new Map<string, number>();
  for (const s of satirlar) {
    const k = `${s.sayfa}:${s.sutun}`;
    solKenar.set(k, Math.min(solKenar.get(k) ?? Infinity, s.x));
  }

  const paragraflar: string[] = [];
  let onceki: Satir | null = null;
  for (const s of satirlar) {
    const metin = s.t.replace(/\s+/g, " ").trim();
    if (!metin) continue;
    if (/^Tarih\s*:/i.test(metin)) continue;
    const girinti = s.x - (solKenar.get(`${s.sayfa}:${s.sutun}`) ?? s.x) > H * 0.8;
    const aynisutun = onceki && onceki.sayfa === s.sayfa && onceki.sutun === s.sutun;
    const buyukBosluk = aynisutun && onceki!.y - s.y > H * 2.2;
    if (!paragraflar.length || girinti || buyukBosluk) {
      paragraflar.push(metin);
    } else {
      const son = paragraflar[paragraflar.length - 1];
      paragraflar[paragraflar.length - 1] = son.endsWith("-") ? son + metin : `${son} ${metin}`;
    }
    onceki = s;
  }

  // Arapça bölümler (ayet ve hadislerin asılları) PDF'ten harekeleri dağılarak
  // çıkıyor; bozuk göstermek yerine hiç gösterilmez, PDF bağlantısı önerilir.
  let arapcaAtlandi = false;
  for (let i = paragraflar.length - 1; i >= 0; i--) {
    const harf = paragraflar[i].match(/\p{L}/gu)?.length ?? 0;
    const arap = paragraflar[i].match(/\p{Script=Arabic}/gu)?.length ?? 0;
    if (arap > 0 && (harf === 0 || arap / harf > 0.3)) {
      paragraflar.splice(i, 1);
      arapcaAtlandi = true;
    }
  }

  // Büyük harfli başlık (ilk paragraf, harflerin hepsi büyük) ayrıca gösteriliyor.
  if (paragraflar.length && /\p{L}/u.test(paragraflar[0]) && paragraflar[0] === paragraflar[0].toLocaleUpperCase("tr-TR") && paragraflar[0].length < 120) {
    paragraflar.shift();
  }

  const sonuc: HutbeParagrafi[] = paragraflar.map((metin, i) => {
    if (i === paragraflar.length - 1 && /Genel Müdürlüğü\s*$/.test(metin) && metin.length < 80) return { tur: "imza", metin };
    if (metin.length <= 60 && /!$/.test(metin)) return { tur: "hitap", metin };
    return { tur: "metin", metin };
  });

  const toplam = sonuc.filter((p) => p.tur === "metin").reduce((n, p) => n + p.metin.length, 0);
  if (sonuc.length < 3 || toplam < 400) return null;

  return {
    paragraflar: sonuc,
    arapcaAtlandi,
    dipnotlar: dipnotlar.map((d) => ({ no: d.no, metin: d.metin.replace(/\s+/g, " ").trim() })).filter((d) => d.metin),
  };
}
