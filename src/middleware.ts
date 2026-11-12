import { NextRequest, NextResponse } from "next/server";

/**
 * Yönetici bölümü koruması (/admin ve /api/admin/*).
 *
 * Tarayıcı kullanıcı adı + şifre sorar (HTTP Basic Auth).
 * Şifrenin kendisi kodda tutulmaz, yalnızca SHA-256 özeti tutulur.
 * Vercel'de ADMIN_USER / ADMIN_PASSWORD_SHA256 ortam değişkenleri
 * tanımlanırsa onlar kullanılır; yoksa aşağıdaki varsayılanlar geçerlidir.
 */
const DEFAULT_ADMIN_USER = "yonetici";
const DEFAULT_ADMIN_PASSWORD_SHA256 =
  "da55043439368c57862895c1ec39c7ce885dff5c5f9a833d13cd59c770a026d8";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Yetkisiz erişim", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sirdas Yonetici", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export async function middleware(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = new TextDecoder().decode(
      Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0))
    );
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const expectedUser = process.env.ADMIN_USER || DEFAULT_ADMIN_USER;
  const expectedHash = (
    process.env.ADMIN_PASSWORD_SHA256 || DEFAULT_ADMIN_PASSWORD_SHA256
  ).toLowerCase();

  const passHash = await sha256Hex(pass);
  if (!safeEqual(user, expectedUser) || !safeEqual(passHash, expectedHash)) {
    return unauthorized();
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
