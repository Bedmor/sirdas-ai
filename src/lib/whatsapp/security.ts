import crypto from "crypto";

/**
 * Meta WhatsApp Webhook X-Hub-Signature-256 HMAC SHA-256 imza doğrulayıcısı
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }

  // Header formatı: "sha256=<hex_hash>"
  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedHash = parts[1];
  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(rawBody, "utf8");
  const computedHash = hmac.digest("hex");

  try {
    const expectedBuffer = Buffer.from(expectedHash, "hex");
    const computedBuffer = Buffer.from(computedHash, "hex");

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, computedBuffer);
  } catch {
    return false;
  }
}
