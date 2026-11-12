/**
 * Namaz vakitleri kaynak katmanı (yalnız sunucu tarafında kullanılır).
 *
 * 1) İl / ilçe seçimi: önce Diyanet İşleri Başkanlığı'nın vakit tablosu,
 *    Diyanet verisini birebir yansıtan açık servis (ezanvakti.emushaf.net)
 *    üzerinden denenir. Anahtar gerektirmez.
 * 2) Bu servis hata verir ya da sunucudan gelen isteği reddederse vakitler
 *    otomatik olarak il merkezinin koordinatıyla (statik liste, ./iller.ts)
 *    Aladhan servisinden "Diyanet İşleri Başkanlığı, Turkey" yöntemiyle
 *    (method=13) hesaplanır; Diyanet tablosundan ±1 dakika sapabilir.
 * 3) Konumla: aynı Aladhan hesabı. Konum 2 ondalığa (~1 km) yuvarlanır,
 *    saklanmaz ve kaydedilmez.
 *
 * Yanıtlar hem bu sunucunun belleğinde hem Next veri önbelleğinde tutulur.
 */
import { bolgeZamani, noktaliTarihtenIso, type GunlukVakit, type VakitYaniti } from "./namaz-vakitleri";
import type { Il } from "./iller";

const DIYANET_KAYNAK = "https://ezanvakti.emushaf.net";
const ALADHAN_KAYNAK = "https://api.aladhan.com/v1";
const TURKIYE_SAAT_DILIMI = "Europe/Istanbul";

/** Diyanet kaynağı hata verince bu süre boyunca doğrudan yedeğe geçilir. */
const DIYANET_BEKLEME_MS = 10 * 60 * 1000;

const bellek = new Map<string, { bitis: number; veri: unknown }>();
let diyanetKapaliBitis = 0;

/** Testler için: bellek önbelleğini ve Diyanet bekleme durumunu sıfırlar. */
export function kaynakDurumunuSifirla() {
  bellek.clear();
  diyanetKapaliBitis = 0;
}

class KaynakHatasi extends Error {
  constructor(readonly durum: number) {
    super(`Kaynak yanıt vermedi (${durum})`);
  }
}

async function onbellekliJson<T>(url: string, saniye: number, zamanAsimiMs = 10000): Promise<T> {
  const simdi = Date.now();
  const kayit = bellek.get(url);
  if (kayit && kayit.bitis > simdi) return kayit.veri as T;

  const yanit = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: saniye },
    signal: AbortSignal.timeout(zamanAsimiMs),
  } as RequestInit);
  if (!yanit.ok) throw new KaynakHatasi(yanit.status);
  const veri = (await yanit.json()) as T;
  if (bellek.size > 500) bellek.clear();
  bellek.set(url, { bitis: simdi + saniye * 1000, veri });
  return veri;
}

/** Diyanet kaynağından okur; hata olursa bir süre bu kaynağı denemez. */
async function diyanetJson<T>(yol: string, saniye: number): Promise<T> {
  const url = `${DIYANET_KAYNAK}${yol}`;
  const kayit = bellek.get(url);
  if (!(kayit && kayit.bitis > Date.now()) && diyanetKapaliBitis > Date.now()) {
    throw new Error("Diyanet kaynağı geçici olarak devre dışı");
  }
  try {
    return await onbellekliJson<T>(url, saniye, 5000);
  } catch (e) {
    // Bulunamayan tek bir kod (404) kaynağı herkes için kapatmasın;
    // erişim engeli, zaman aşımı ve sunucu hatalarında bekleme başlar.
    if (!(e instanceof KaynakHatasi && e.durum === 404)) diyanetKapaliBitis = Date.now() + DIYANET_BEKLEME_MS;
    throw e;
  }
}

export function basHarfBuyuk(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(/(\s+|-)/)
    .map((p) => (p.length ? p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1) : p))
    .join("");
}

type EmushafIlce = { IlceAdi: string; IlceID: string };
type EmushafVakit = {
  MiladiTarihKisa: string;
  HicriTarihUzun: string;
  Imsak: string;
  Gunes: string;
  Ogle: string;
  Ikindi: string;
  Aksam: string;
  Yatsi: string;
};

type AladhanGun = {
  data: {
    timings: Record<string, string>;
    date: { gregorian: { date: string } };
    meta: { timezone: string };
  };
};

const temizSaat = (s: string) => (s || "").trim().slice(0, 5);

function aladhanGunu(j: AladhanGun): GunlukVakit {
  const t = j.data.timings;
  const [g, a, y] = j.data.date.gregorian.date.split("-");
  // Hicri tarih Aladhan'da farklı takvimle hesaplandığı için Diyanet'ten
  // bir gün sapabilir; yanlış bilgi vermemek için gösterilmez.
  return {
    tarih: `${y}-${a}-${g}`,
    // Diyanet'in "İmsak" vakti, Aladhan'daki "Fajr" (18°) değerine karşılık gelir.
    imsak: temizSaat(t.Fajr),
    gunes: temizSaat(t.Sunrise),
    ogle: temizSaat(t.Dhuhr),
    ikindi: temizSaat(t.Asr),
    aksam: temizSaat(t.Maghrib),
    yatsi: temizSaat(t.Isha),
  };
}

function isoToAladhan(iso: string): string {
  const [y, a, g] = iso.split("-");
  return `${g}-${a}-${y}`;
}

function yarin(iso: string): string {
  const [y, a, g] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, a - 1, g + 1));
  return d.toISOString().slice(0, 10);
}

/** İlin ilçe listesi (Diyanet kodlarıyla). Kaynak yoksa yalnız il merkezi döner. */
export async function ilceListesi(il: Il): Promise<{ id: string; ad: string }[]> {
  try {
    const ilceler = await diyanetJson<EmushafIlce[]>(`/ilceler/${il.id}`, 60 * 60 * 24 * 30);
    const liste = ilceler.map((i) => ({ id: i.IlceID, ad: basHarfBuyuk(i.IlceAdi) }));
    if (liste.length > 0) return liste;
  } catch {
    // Yedeğe düş.
  }
  return [{ id: il.merkezIlceId, ad: il.ad }];
}

/** Aladhan ile Diyanet yöntemi (method=13) hesabı: bugün + yarın. */
export async function aladhanVakitleri(
  latH: number,
  lngH: number,
  yer: string,
  kaynakAdi: string,
  bilinenSaatDilimi?: string
): Promise<VakitYaniti> {
  const lat = latH.toFixed(2);
  const lng = lngH.toFixed(2);
  const url = (tarih: string) => `${ALADHAN_KAYNAK}/timings/${tarih}?latitude=${lat}&longitude=${lng}&method=13`;

  let saatDilimi = bilinenSaatDilimi;
  if (!saatDilimi) {
    const ilk = await onbellekliJson<AladhanGun>(url(isoToAladhan(new Date().toISOString().slice(0, 10))), 60 * 60 * 6);
    saatDilimi = ilk.data.meta.timezone || "UTC";
  }
  const yerelBugun = bolgeZamani(new Date(), saatDilimi).tarih;
  const [bugunJ, yarinJ] = await Promise.all([
    onbellekliJson<AladhanGun>(url(isoToAladhan(yerelBugun)), 60 * 60 * 6),
    onbellekliJson<AladhanGun>(url(isoToAladhan(yarin(yerelBugun))), 60 * 60 * 6),
  ]);
  return {
    kaynak: "hesap",
    kaynakAdi,
    yer,
    saatDilimi,
    gunler: [aladhanGunu(bugunJ), aladhanGunu(yarinJ)],
  };
}

/** İlçenin Diyanet tablosu; yoksa null. */
async function diyanetVakitleri(ilceId: string, yer: string): Promise<VakitYaniti | null> {
  const ham = await diyanetJson<EmushafVakit[]>(`/vakitler/${ilceId}`, 60 * 60 * 6);
  const bugun = bolgeZamani(new Date(), TURKIYE_SAAT_DILIMI).tarih;
  const gunler: GunlukVakit[] = ham
    .map((v) => ({
      tarih: noktaliTarihtenIso(v.MiladiTarihKisa),
      hicri: v.HicriTarihUzun,
      imsak: temizSaat(v.Imsak),
      gunes: temizSaat(v.Gunes),
      ogle: temizSaat(v.Ogle),
      ikindi: temizSaat(v.Ikindi),
      aksam: temizSaat(v.Aksam),
      yatsi: temizSaat(v.Yatsi),
    }))
    .filter((g) => g.tarih >= bugun)
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
    .slice(0, 3);
  if (gunler.length === 0) return null;
  return {
    kaynak: "diyanet",
    kaynakAdi: "Diyanet İşleri Başkanlığı vakit tablosu",
    yer,
    saatDilimi: TURKIYE_SAAT_DILIMI,
    gunler,
  };
}

/**
 * İl/ilçe vakitleri: önce Diyanet tablosu (ilçe kodu, yoksa il merkezi),
 * olmazsa il merkezi koordinatıyla Aladhan method=13.
 * `il` verilmezse yedek yoktur ve hata yükselir.
 */
export async function ilVakitleri(il: Il | undefined, ilceId: string | undefined, yer: string): Promise<VakitYaniti> {
  const kod = ilceId || il?.merkezIlceId;
  if (kod) {
    try {
      const v = await diyanetVakitleri(kod, yer);
      if (v) return v;
    } catch {
      // Yedeğe düş.
    }
  }
  if (!il) throw new Error("Vakit bilgisi alınamadı");
  return aladhanVakitleri(
    il.lat,
    il.lng,
    il.ad,
    `Diyanet yöntemiyle ${il.ad} il merkezi için hesaplanmış (Aladhan, method 13)`,
    TURKIYE_SAAT_DILIMI
  );
}
