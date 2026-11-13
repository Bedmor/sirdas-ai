import { NextResponse } from "next/server";
import { SIRDAS_CLIENT_COOKIE } from "@/lib/auth/better-auth-ready";

/**
 * POST /api/cihaz-temizle
 * "Bu cihazdan temizle": yalnız bu tarayıcının kimlik çerezini kaldırır.
 * Veritabanına dokunmaz; sunucudaki konuşmalar ve profil saklanmaya devam eder.
 * Çerez kalkınca tarayıcının ürettiği yeni cihaz kimliği geçerli olur ve
 * eski kayıtlar bu cihazda bir daha yüklenmez.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SIRDAS_CLIENT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
