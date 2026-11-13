/**
 * Cuma hutbesi kaynak katmanı (yalnız sunucu tarafında kullanılır).
 *
 * Diyanet İşleri Başkanlığı Din Hizmetleri Genel Müdürlüğü'nün Türkçe hutbe
 * listesi okunur, son cuma hutbelerinin PDF'leri metne çevrilir. Veri tabanı ve
 * zamanlanmış iş yoktur:
 * - Sonuç Next veri önbelleğinde (unstable_cache) 3 saat tutulur; ziyaretçi
 *   başına Diyanet'e istek gitmez. Yeni cuma hutbesi en geç bir yenilemede görünür.
 * - Diyanet'e ulaşılamazsa ya da sayfa yapısı değişirse önbellekteki son başarılı
 *   veri, o da yoksa bu sunucunun belleğindeki son başarılı veri kullanılır;
 *   hiçbiri yoksa null döner ve sayfa sade bir uyarı gösterir.
 * - Hata sonrası 10 dakika Diyanet yeniden denenmez (siteyi zorlamamak için).
 */
import { unstable_cache } from "next/cache";
import {
  HUTBE_LISTE_ADRESI,
  cumaHutbeleriniSec,
  hutbeListesiniAyristir,
  pdfMetniniAyristir,
  turkiyeBugunIso,
  type Hutbe,
  type HutbeMetni,
  type PdfSayfasi,
} from "./cuma-hutbesi";

/** Önbellek süresi (saniye): 3 saat. */
export const HUTBE_ONBELLEK_SN = 3 * 60 * 60;
/** Metni çıkarılacak en fazla hutbe (tarih süzmesinden önce, ileri tarihli olasılığına karşı birkaç fazla). */
const ISLENECEK_HUTBE = 7;
const HATA_BEKLEME_MS = 10 * 60 * 1000;
const EN_BUYUK_PDF = 8 * 1024 * 1024;
const ISTEK_BASLIKLARI = {
  "User-Agent": "Mozilla/5.0 (compatible; ManeviPusula-HutbeOkuyucu/1.0)",
  "Accept-Language": "tr-TR,tr;q=0.9",
};

export type HutbeVerisi = { alindi: string; hutbeler: Hutbe[] };

/** PDF baytlarından sayfa başına metin öğeleri (pdf.js, sunucusuz yapı). */
export async function pdfSayfalariniOku(veri: Uint8Array): Promise<PdfSayfasi[]> {
  const { getDocumentProxy } = await import("unpdf");
  const belge = await getDocumentProxy(veri, { verbosity: 0 });
  const sayfalar: PdfSayfasi[] = [];
  try {
    for (let i = 1; i <= Math.min(belge.numPages, 6); i++) {
      const sayfa = await belge.getPage(i);
      const icerik = await sayfa.getTextContent();
      const ogeler = (icerik.items as unknown[])
        .filter((o): o is { str: string; transform: number[]; height: number } => !!o && typeof (o as { str?: unknown }).str === "string")
        .map((o) => ({ str: o.str, transform: o.transform, height: o.height }));
      sayfalar.push({ genislik: sayfa.view[2] - sayfa.view[0], ogeler });
    }
  } finally {
    await Promise.resolve(belge.cleanup?.()).catch(() => {});
  }
  return sayfalar;
}

async function pdfMetni(adres: string): Promise<HutbeMetni | null> {
  try {
    const yanit = await fetch(adres, { headers: ISTEK_BASLIKLARI, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!yanit.ok) return null;
    const tampon = new Uint8Array(await yanit.arrayBuffer());
    if (tampon.byteLength > EN_BUYUK_PDF || tampon.byteLength < 5) return null;
    if (String.fromCharCode(...tampon.slice(0, 5)) !== "%PDF-") return null;
    return pdfMetniniAyristir(await pdfSayfalariniOku(tampon));
  } catch {
    return null;
  }
}

/** Önbelleksiz: listeyi okur, son cuma hutbelerinin metnini çıkarır. Liste okunamazsa hata fırlatır. */
export async function hutbeleriTopla(an = new Date()): Promise<HutbeVerisi> {
  const yanit = await fetch(HUTBE_LISTE_ADRESI, { headers: ISTEK_BASLIKLARI, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!yanit.ok) throw new Error(`Diyanet hutbe listesi yanıt vermedi (${yanit.status})`);
  const kayitlar = hutbeListesiniAyristir(await yanit.text());
  // Bir hafta ileriye kadar tarihli hutbeler de işlenir; gösterimde bugüne göre süzülür.
  const ileri = turkiyeBugunIso(new Date(an.getTime() + 7 * 24 * 60 * 60 * 1000));
  const secilen = cumaHutbeleriniSec(kayitlar, ileri, ISLENECEK_HUTBE);
  if (!secilen.length) throw new Error("Listede cuma hutbesi bulunamadı");
  const hutbeler = await Promise.all(
    secilen.map(async (k) => ({ ...k, metin: k.pdf ? await pdfMetni(k.pdf) : null })),
  );
  return { alindi: an.toISOString(), hutbeler };
}

let sonBasarili: HutbeVerisi | null = null;
let hataBitis = 0;

/** Testler için bellek durumunu sıfırlar. */
export function hutbeDurumunuSifirla() {
  sonBasarili = null;
  hataBitis = 0;
}

/**
 * Verilen yükleyiciyi çalıştırır; başarısız olursa son başarılı veriyi döndürür.
 * Hata sonrası bekleme süresince yükleyici hiç çağrılmaz.
 */
export async function sonBasariliIleGetir(yukle: () => Promise<HutbeVerisi>, simdi = Date.now()): Promise<HutbeVerisi | null> {
  if (hataBitis > simdi) return sonBasarili;
  try {
    const veri = await yukle();
    if (!veri?.hutbeler?.length) throw new Error("Boş hutbe verisi");
    sonBasarili = veri;
    return veri;
  } catch (e) {
    hataBitis = simdi + HATA_BEKLEME_MS;
    console.warn("[cuma-hutbesi] Diyanet verisi alınamadı:", e instanceof Error ? e.message : e);
    return sonBasarili;
  }
}

const onbellekliTopla = unstable_cache(() => hutbeleriTopla(), ["cuma-hutbeleri-v1"], {
  revalidate: HUTBE_ONBELLEK_SN,
  tags: ["cuma-hutbesi"],
});

export type GosterilecekHutbeler = { buHafta: Hutbe | null; arsiv: Hutbe[]; alindi: string } | null;

/** Sayfanın kullandığı giriş: bugüne göre bu haftanın hutbesi ve önceki 4 cuma. */
export async function cumaHutbeleri(an = new Date()): Promise<GosterilecekHutbeler> {
  const veri = await sonBasariliIleGetir(onbellekliTopla);
  return hutbeleriGosterimeHazirla(veri, an);
}

export function hutbeleriGosterimeHazirla(veri: HutbeVerisi | null, an: Date): GosterilecekHutbeler {
  if (!veri) return null;
  const bes = cumaHutbeleriniSec(veri.hutbeler, turkiyeBugunIso(an));
  if (!bes.length) return null;
  return { buHafta: bes[0], arsiv: bes.slice(1), alindi: veri.alindi };
}
