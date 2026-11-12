/**
 * Namaz vakitleri için ortak tipler ve saf hesap fonksiyonları
 * (sıradaki vakit, kalan süre). Hem sunucu hem tarayıcı tarafında kullanılır.
 */

export type VakitAnahtari = "imsak" | "gunes" | "ogle" | "ikindi" | "aksam" | "yatsi";

export type GunlukVakit = {
  /** YYYY-MM-DD (bölgenin yerel takvim günü) */
  tarih: string;
  hicri?: string;
} & Record<VakitAnahtari, string>; // "HH:MM"

export type VakitYaniti = {
  kaynak: "diyanet" | "hesap";
  kaynakAdi: string;
  yer: string;
  saatDilimi: string;
  gunler: GunlukVakit[];
};

export const VAKITLER: { anahtar: VakitAnahtari; ad: string }[] = [
  { anahtar: "imsak", ad: "İmsak" },
  { anahtar: "gunes", ad: "Güneş" },
  { anahtar: "ogle", ad: "Öğle" },
  { anahtar: "ikindi", ad: "İkindi" },
  { anahtar: "aksam", ad: "Akşam" },
  { anahtar: "yatsi", ad: "Yatsı" },
];

export type BolgeZamani = { tarih: string; saniye: number };

/** Verilen anın, verilen saat dilimindeki yerel tarih ve gün içi saniyesi. */
export function bolgeZamani(an: Date, saatDilimi: string): BolgeZamani {
  const parcalar = new Intl.DateTimeFormat("en-CA", {
    timeZone: saatDilimi,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(an);
  const al = (t: string) => parcalar.find((p) => p.type === t)?.value ?? "00";
  const saat = Number(al("hour")) % 24;
  return {
    tarih: `${al("year")}-${al("month")}-${al("day")}`,
    saniye: saat * 3600 + Number(al("minute")) * 60 + Number(al("second")),
  };
}

/** "YYYY-MM-DD" + "HH:MM" -> mutlak "duvar saati" saniyesi (karşılaştırma için). */
function duvarSaniyesi(tarih: string, saat: string): number {
  const [y, m, d] = tarih.split("-").map(Number);
  const [hh, mm] = saat.split(":").map(Number);
  return Date.UTC(y, m - 1, d) / 1000 + hh * 3600 + mm * 60;
}

export type SiradakiVakit = {
  anahtar: VakitAnahtari;
  ad: string;
  tarih: string;
  saat: string;
  kalanSaniye: number;
  /** Şu an içinde bulunulan vakit (ör. öğle ile ikindi arası -> "ogle"). */
  mevcut: VakitAnahtari | null;
};

/**
 * Sıradaki vakti ve kalan süreyi bulur. `gunler` en az bugünü ve
 * (yatsıdan sonrası için) yarını içermelidir; yoksa null döner.
 */
export function siradakiVakit(gunler: GunlukVakit[], simdi: BolgeZamani): SiradakiVakit | null {
  const simdiS = duvarSaniyesi(simdi.tarih, "00:00") + simdi.saniye;
  const sirali = [...gunler].sort((a, b) => a.tarih.localeCompare(b.tarih));
  let mevcut: VakitAnahtari | null = null;
  for (const gun of sirali) {
    for (const v of VAKITLER) {
      const saat = gun[v.anahtar];
      if (!/^\d{1,2}:\d{2}$/.test(saat)) continue;
      const t = duvarSaniyesi(gun.tarih, saat);
      if (t > simdiS) {
        return { anahtar: v.anahtar, ad: v.ad, tarih: gun.tarih, saat, kalanSaniye: t - simdiS, mevcut };
      }
      mevcut = v.anahtar;
    }
  }
  return null;
}

/** Kalan süreyi "SS:DD:ss" biçiminde yazar. */
export function kalanSureSaat(saniye: number): string {
  const s = Math.max(0, Math.floor(saniye));
  const iki = (n: number) => String(n).padStart(2, "0");
  return `${iki(Math.floor(s / 3600))}:${iki(Math.floor((s % 3600) / 60))}:${iki(s % 60)}`;
}

/** Kalan süreyi okunur Türkçe yazar: "2 saat 14 dakika", "14 dakika", "1 dakikadan az". */
export function kalanSureMetni(saniye: number): string {
  const dk = Math.floor(Math.max(0, saniye) / 60);
  if (dk < 1) return "1 dakikadan az";
  const sa = Math.floor(dk / 60);
  const kalanDk = dk % 60;
  if (sa === 0) return `${kalanDk} dakika`;
  if (kalanDk === 0) return `${sa} saat`;
  return `${sa} saat ${kalanDk} dakika`;
}

/** "12.11.2026" -> "2026-11-12" */
export function noktaliTarihtenIso(t: string): string {
  const [g, a, y] = t.split(".");
  return `${y}-${a.padStart(2, "0")}-${g.padStart(2, "0")}`;
}
