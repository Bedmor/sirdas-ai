import { NextRequest } from "next/server";
import { duaDeposunuAl } from "@/lib/dua-havuzu/depo-secimi";
import { allahYardimcinOlsun } from "@/lib/dua-havuzu/servis";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { ipAnahtari, istekKimligi, ULASILAMADI, yanit } from "../ortak";

export const dynamic = "force-dynamic";

/** POST { id } -> "Allah yardımcın olsun" (aynı cihaz aynı isteğe bir kez). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const hiz = checkRateLimit(ipAnahtari(req, "dua_destek"), 60, 60_000);
  if (!hiz.allowed) {
    return yanit({ durum: "cok_hizli", hata: "Lütfen biraz yavaş basın ve birkaç saniye sonra yeniden deneyin." }, 429);
  }
  try {
    const depo = await duaDeposunuAl();
    const sonuc = await allahYardimcinOlsun(depo, { kimlikOzeti: istekKimligi(req), duaId: body?.id });
    const status = sonuc.durum === "bulunamadi" ? 404 : sonuc.durum === "kendi" ? 409 : 200;
    return yanit(sonuc, status);
  } catch (err) {
    console.warn("[POST /api/dua-havuzu/destek]", (err as Error)?.message);
    return yanit({ hata: ULASILAMADI }, 503);
  }
}
