import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/security";
import { processIncomingMessage } from "@/lib/ai/orchestrator";
import { WhatsAppClient } from "@/lib/whatsapp/client";

// Serverless ortamında arka plan işlerinin zaman aşımına uğramaması için
export const maxDuration = 60;

// GET: Meta Webhook Doğrulama (Hub Challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Gelen Mesajın Karşılanması ve after() ile Anında 200 OK
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // 1. HMAC SHA-256 İmza Doğrulaması (Production ve gizli anahtar tanımlıysa)
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret && appSecret !== "mock_meta_app_secret") {
    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
      return new NextResponse("Unauthorized signature", { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  // Durum güncellemelerini (sent, delivered, read) yoksay ve 200 OK dön
  if (!message) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  // Ses, fotoğraf veya doküman gönderildiyse nazikçe yazılı mesaja davet et
  if (message.type !== "text") {
    const wa = new WhatsAppClient();
    try {
      after(async () => {
        await wa.sendTextMessage(
          message.from,
          "Aziz sırdaşım, şu an yalnızca yazılı dertleşme mesajlarını dinleyebiliyorum. Gönlünü daraltan derdini kelimelere dökerek yazarsan sana kulak vermeye hazırım."
        );
      });
    } catch {
      wa.sendTextMessage(
        message.from,
        "Aziz sırdaşım, şu an yalnızca yazılı dertleşme mesajlarını dinleyebiliyorum. Gönlünü daraltan derdini kelimelere dökerek yazarsan sana kulak vermeye hazırım."
      ).catch(() => {});
    }
    return NextResponse.json({ status: "media_not_supported" }, { status: 200 });
  }

  const messageData = {
    phoneNumber: message.from,
    text: message.text.body,
    messageId: message.id
  };

  // 2. next/server after() ile arka plan işlemini asenkron başlat
  try {
    after(async () => {
      try {
        await processIncomingMessage(messageData);
      } catch (error) {
        console.error("[WhatsApp Webhook Worker Error in after()]", error);
      }
    });
  } catch {
    // Standalone test veya request-scope dışı ortamlarda doğrudan arka plan promise'i olarak çalıştır
    processIncomingMessage(messageData).catch(error => {
      console.error("[WhatsApp Webhook Standalone Worker Error]", error);
    });
  }

  // 3. Meta'ya ANINDA (<50ms) 200 OK dönerek 3 sn SLA'ini koru
  return NextResponse.json({ status: "processing" }, { status: 200 });
}
