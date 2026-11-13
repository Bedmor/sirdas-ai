import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSirdasChatActor } from "@/lib/auth/better-auth-ready";
import {
  denetimGeriBildirimiYaz,
  koduTemizle,
  type DenetimGeriBildirimi,
} from "@/lib/denetim/kayit";

/**
 * POST /api/chat/denetim-bildirimi
 * "Bu uyarı yersiz miydi?" geri bildirimi (Adnan Bey 12.11, madde 11: yanlış alarm kaydı).
 *
 * Gövde: { messageId?: string, kuralKodu?: string, yersiz: boolean, clientId?: string }
 * - İçerik kaydedilmez; yalnızca evet/hayır, kural kodu ve zaman.
 * - messageId verilirse ve mesaj bu ziyaretçiye aitse, mevcut editorAudit alanına
 *   "denetimGeriBildirimi" anahtarı yazılır (yeni tablo yok). Aksi hâlde yalnız sunucu günlüğü.
 */
const UUID_DESENI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.yersiz !== "boolean") {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const bildirim: DenetimGeriBildirimi = {
    yersiz: body.yersiz,
    kuralKodu: koduTemizle(body.kuralKodu),
    zaman: new Date().toISOString(),
  };

  let kayitli = false;
  const messageId =
    typeof body.messageId === "string" && UUID_DESENI.test(body.messageId)
      ? body.messageId
      : null;

  if (messageId) {
    try {
      const actor = resolveSirdasChatActor(req, body.clientId);
      const userKey = `web_chat_${actor.clientId}`;
      const mesaj = await prisma.message.findFirst({
        where: { id: messageId, role: "ASSISTANT", user: { phoneNumber: userKey } },
        select: { id: true, editorAudit: true },
      });
      if (mesaj) {
        const mevcut =
          mesaj.editorAudit && typeof mesaj.editorAudit === "object"
            ? (mesaj.editorAudit as Record<string, unknown>)
            : {};
        await prisma.message.update({
          where: { id: mesaj.id },
          data: {
            editorAudit: JSON.parse(
              JSON.stringify({ ...mevcut, denetimGeriBildirimi: bildirim })
            ),
          },
        });
        kayitli = true;
      }
    } catch (err) {
      console.warn("[POST /api/chat/denetim-bildirimi DB Warning]", err);
    }
  }

  denetimGeriBildirimiYaz({ ...bildirim, kayitli });
  return NextResponse.json({ success: true, kayitli });
}
