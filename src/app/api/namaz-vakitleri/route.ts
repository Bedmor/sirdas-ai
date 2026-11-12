import { NextRequest, NextResponse } from "next/server";
import {
  bolgeZamani,
  noktaliTarihtenIso,
  type GunlukVakit,
  type VakitYaniti,
} from "@/lib/araclar/namaz-vakitleri";

/**
 * Namaz vakitleri ara katmanı.
 *
 * 1) İl / ilçe seçimi: Diyanet İşleri Başkanlığı'nın yayımladığı vakitler,
 *    Diyanet verisini birebir yansıtan açık servis (ezanvakti.emushaf.net)
 *    üzerinden alınır. Anahtar gerektirmez.
 * 2) Konumla: Aladhan servisi, "Diyanet İşleri Başkanlığı, Turkey" yöntemiyle
 *    (method=13) hesaplar; Diyanet tablosundan ±1-2 dakika sapabilir.
 *    Konum 2 ondalığa (~1 km) yuvarlanır, saklanmaz ve kaydedilmez.
 *
 * Yanıtlar hem bu sunucunun belleğinde hem Next veri önbelleğinde tutulur.
 */

const DIYANET_KAYNAK = "https://ezanvakti.emushaf.net";
const ALADHAN_KAYNAK = "https://api.aladhan.com/v1";
const TURKIYE_ID = "2";

const bellek = new Map<string, { bitis: number; veri: unknown }>();

async function onbellekliJson<T>(url: string, saniye: number): Promise<T> {
  const simdi = Date.now();
  const kayit = bellek.get(url);
  if (kayit && kayit.bitis > simdi) return kayit.veri as T;

  const yanit = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: saniye },
    signal: AbortSignal.timeout(10000),
  });
  if (!yanit.ok) throw new Error(`Kaynak yanıt vermedi (${yanit.status})`);
  const veri = (await yanit.json()) as T;
  if (bellek.size > 500) bellek.clear();
  bellek.set(url, { bitis: simdi + saniye * 1000, veri });
  return veri;
}

function hata(mesaj: string, durum = 400) {
  return NextResponse.json({ hata: mesaj }, { status: durum, headers: { "Cache-Control": "no-store" } });
}

function basHarfBuyuk(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(/(\s+|-)/)
    .map((p) => (p.length ? p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1) : p))
    .join("");
}

type EmushafSehir = { SehirAdi: string; SehirID: string };
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

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  try {
    // İl listesi
    if (p.get("tip") === "iller") {
      const iller = await onbellekliJson<EmushafSehir[]>(`${DIYANET_KAYNAK}/sehirler/${TURKIYE_ID}`, 60 * 60 * 24 * 30);
      return NextResponse.json(
        iller.map((i) => ({ id: i.SehirID, ad: basHarfBuyuk(i.SehirAdi) })),
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
      );
    }

    // İlçe listesi
    if (p.get("tip") === "ilceler") {
      const il = p.get("il") || "";
      if (!/^\d{1,6}$/.test(il)) return hata("Geçersiz il.");
      const ilceler = await onbellekliJson<EmushafIlce[]>(`${DIYANET_KAYNAK}/ilceler/${il}`, 60 * 60 * 24 * 30);
      return NextResponse.json(
        ilceler.map((i) => ({ id: i.IlceID, ad: basHarfBuyuk(i.IlceAdi) })),
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
      );
    }

    // İlçeye göre Diyanet vakitleri
    const ilce = p.get("ilce");
    if (ilce !== null) {
      if (!/^\d{1,6}$/.test(ilce)) return hata("Geçersiz ilçe.");
      const ham = await onbellekliJson<EmushafVakit[]>(`${DIYANET_KAYNAK}/vakitler/${ilce}`, 60 * 60 * 6);
      const bugun = bolgeZamani(new Date(), "Europe/Istanbul").tarih;
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
      if (gunler.length === 0) return hata("Bu ilçe için güncel vakit bulunamadı.", 502);
      const yanit: VakitYaniti = {
        kaynak: "diyanet",
        kaynakAdi: "Diyanet İşleri Başkanlığı vakit tablosu",
        yer: (p.get("ad") || "").slice(0, 80),
        saatDilimi: "Europe/Istanbul",
        gunler,
      };
      return NextResponse.json(yanit, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" },
      });
    }

    // Konuma göre (Diyanet yöntemiyle hesap)
    const latH = Number(p.get("lat"));
    const lngH = Number(p.get("lng"));
    if (p.has("lat") && p.has("lng")) {
      if (!Number.isFinite(latH) || !Number.isFinite(lngH) || Math.abs(latH) > 90 || Math.abs(lngH) > 180) {
        return hata("Geçersiz konum.");
      }
      const lat = latH.toFixed(2);
      const lng = lngH.toFixed(2);
      const url = (tarih: string) =>
        `${ALADHAN_KAYNAK}/timings/${tarih}?latitude=${lat}&longitude=${lng}&method=13`;

      const ilk = await onbellekliJson<AladhanGun>(url(isoToAladhan(new Date().toISOString().slice(0, 10))), 60 * 60 * 6);
      const saatDilimi = ilk.data.meta.timezone || "UTC";
      const yerelBugun = bolgeZamani(new Date(), saatDilimi).tarih;
      const [bugunJ, yarinJ] = await Promise.all([
        onbellekliJson<AladhanGun>(url(isoToAladhan(yerelBugun)), 60 * 60 * 6),
        onbellekliJson<AladhanGun>(url(isoToAladhan(yarin(yerelBugun))), 60 * 60 * 6),
      ]);
      const yanit: VakitYaniti = {
        kaynak: "hesap",
        kaynakAdi: "Diyanet yöntemiyle hesaplanmış (Aladhan, method 13)",
        yer: "Bulunduğunuz konum",
        saatDilimi,
        gunler: [aladhanGunu(bugunJ), aladhanGunu(yarinJ)],
      };
      return NextResponse.json(yanit, { headers: { "Cache-Control": "private, no-store" } });
    }

    return hata("İl/ilçe veya konum bilgisi gerekli.");
  } catch {
    return hata("Vakit bilgisi şu an alınamadı. Lütfen biraz sonra tekrar deneyin.", 502);
  }
}
