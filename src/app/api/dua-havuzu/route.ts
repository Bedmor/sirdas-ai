import { NextRequest } from "next/server";
import { duaDeposunuAl } from "@/lib/dua-havuzu/depo-secimi";
import {
  duaHavuzunuGetir,
  duaIstegiBirak,
  duaIsteginiKaldir,
  suresiGecenDualariTemizle,
} from "@/lib/dua-havuzu/servis";
import { red } from "@/lib/dua-havuzu/kurallar";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { ipAnahtari, istekKimligi, ULASILAMADI, yanit } from "./ortak";

export const dynamic = "force-dynamic";

/**
 * Dua Havuzu (Adnan Bey 13.11).
 * GET    -> süresi geçmemiş istekler + bu cihazın kendi istekleri
 * POST   -> { konu } hazır seçenekten yeni dua isteği (serbest yazı kabul edilmez; kart cümlesi sunucuda üretilir)
 * DELETE -> { id } bu cihazın kendi isteğini kaldırır
 */
export async function GET(req: NextRequest) {
  try {
    const depo = await duaDeposunuAl();
    const sonuc = await duaHavuzunuGetir(depo, { kimlikOzeti: istekKimligi(req) });
    return yanit(sonuc);
  } catch (err) {
    console.warn("[GET /api/dua-havuzu]", (err as Error)?.message);
    return yanit({ hata: ULASILAMADI }, 503);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Aynı bağlantıdan kısa sürede çok istek (cihaz kimliği değiştirilse bile)
  const hiz = checkRateLimit(ipAnahtari(req, "dua_birak"), 5, 5 * 60_000);
  if (!hiz.allowed) return yanit(red("COK_HIZLI"), 429);

  try {
    const depo = await duaDeposunuAl();
    const sonuc = await duaIstegiBirak(depo, {
      kimlikOzeti: istekKimligi(req),
      govde: body,
    });
    if (!sonuc.tamam) {
      const status = sonuc.sebep === "GUNLUK_SINIR" ? 429 : 422;
      return yanit(sonuc, status);
    }
    // Zamanlanmış iş yok: süresi dolanlar yeni istek geldikçe temizlenir.
    suresiGecenDualariTemizle(depo).catch(() => {});
    return yanit(sonuc, 201);
  } catch (err) {
    console.warn("[POST /api/dua-havuzu]", (err as Error)?.message);
    return yanit({ hata: ULASILAMADI }, 503);
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const depo = await duaDeposunuAl();
    const kaldirildi = await duaIsteginiKaldir(depo, {
      kimlikOzeti: istekKimligi(req),
      duaId: body?.id,
    });
    return yanit({ kaldirildi }, kaldirildi ? 200 : 404);
  } catch (err) {
    console.warn("[DELETE /api/dua-havuzu]", (err as Error)?.message);
    return yanit({ hata: ULASILAMADI }, 503);
  }
}
