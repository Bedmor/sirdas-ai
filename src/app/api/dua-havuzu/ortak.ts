import { NextRequest, NextResponse } from "next/server";
import { resolveSirdasChatActor } from "@/lib/auth/better-auth-ready";
import { kimlikOzetiCikar } from "@/lib/dua-havuzu/servis";

/** İsteği yapan cihazın kimlik özeti (mevcut sohbet kimliği mekanizmasıyla). */
export function istekKimligi(req: NextRequest): string {
  const actor = resolveSirdasChatActor(req);
  return kimlikOzetiCikar(actor.clientId);
}

export function ipAnahtari(req: NextRequest, onek: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "yerel";
  return `${onek}:${ip}`;
}

export function yanit(govde: unknown, status = 200): NextResponse {
  return NextResponse.json(govde, { status, headers: { "Cache-Control": "no-store" } });
}

export const ULASILAMADI =
  "Dua havuzuna şu an ulaşılamıyor. Lütfen biraz sonra yeniden deneyin.";
