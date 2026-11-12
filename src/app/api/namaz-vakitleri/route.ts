import { NextRequest, NextResponse } from "next/server";
import { ILLER, ilBul } from "@/lib/araclar/iller";
import { aladhanVakitleri, ilVakitleri, ilceListesi } from "@/lib/araclar/namaz-vakti-kaynak";

/**
 * Namaz vakitleri ara katmanı. Kaynak seçimi ve yedeğe düşme kuralları
 * için bkz. src/lib/araclar/namaz-vakti-kaynak.ts.
 *
 * - ?tip=iller                 -> 81 il (statik liste)
 * - ?tip=ilceler&il=<id>       -> ilçeler (kaynak yoksa yalnız il merkezi)
 * - ?il=<id>[&ilce=<id>]       -> vakitler (Diyanet tablosu, olmazsa il merkezi hesabı)
 * - ?lat=..&lng=..             -> konuma göre hesap
 */

function hata(mesaj: string, durum = 400) {
  return NextResponse.json({ hata: mesaj }, { status: durum, headers: { "Cache-Control": "no-store" } });
}

const KOD = /^\d{1,6}$/;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  try {
    // İl listesi (statik)
    if (p.get("tip") === "iller") {
      return NextResponse.json(
        ILLER.map((i) => ({ id: i.id, ad: i.ad })),
        { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
      );
    }

    // İlçe listesi
    if (p.get("tip") === "ilceler") {
      const ilKodu = p.get("il") || "";
      if (!KOD.test(ilKodu)) return hata("Geçersiz il.");
      const il = ilBul(ilKodu);
      if (!il) return hata("Bilinmeyen il.");
      const liste = await ilceListesi(il);
      // Yalnız il merkezi dönmüşse (kaynak erişilemedi) kısa süre önbellekle.
      const uzun = liste.length > 1;
      return NextResponse.json(liste, {
        headers: {
          "Cache-Control": uzun
            ? "public, s-maxage=86400, stale-while-revalidate=604800"
            : "public, s-maxage=600, stale-while-revalidate=3600",
        },
      });
    }

    // İl / ilçeye göre vakitler
    const ilKodu = p.get("il");
    const ilce = p.get("ilce");
    if (ilKodu !== null || ilce !== null) {
      if (ilKodu !== null && !KOD.test(ilKodu)) return hata("Geçersiz il.");
      if (ilce !== null && !KOD.test(ilce)) return hata("Geçersiz ilçe.");
      const il = ilKodu !== null ? ilBul(ilKodu) : undefined;
      if (ilKodu !== null && !il) return hata("Bilinmeyen il.");
      const yanit = await ilVakitleri(il, ilce ?? undefined, (p.get("ad") || il?.ad || "").slice(0, 80));
      return NextResponse.json(yanit, {
        headers: {
          "Cache-Control":
            yanit.kaynak === "diyanet"
              ? "public, s-maxage=3600, stale-while-revalidate=21600"
              : "public, s-maxage=600, stale-while-revalidate=3600",
        },
      });
    }

    // Konuma göre (Diyanet yöntemiyle hesap)
    const latH = Number(p.get("lat"));
    const lngH = Number(p.get("lng"));
    if (p.has("lat") && p.has("lng")) {
      if (!Number.isFinite(latH) || !Number.isFinite(lngH) || Math.abs(latH) > 90 || Math.abs(lngH) > 180) {
        return hata("Geçersiz konum.");
      }
      const yanit = await aladhanVakitleri(
        latH,
        lngH,
        "Bulunduğunuz konum",
        "Diyanet yöntemiyle hesaplanmış (Aladhan, method 13)"
      );
      return NextResponse.json(yanit, { headers: { "Cache-Control": "private, no-store" } });
    }

    return hata("İl/ilçe veya konum bilgisi gerekli.");
  } catch {
    return hata("Vakit bilgisi şu an alınamadı. Lütfen biraz sonra tekrar deneyin.", 502);
  }
}
