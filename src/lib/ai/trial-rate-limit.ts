import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const TRIAL_COOKIE_NAME = "sirdas_trial_v1";
export const TRIAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// In-memory burst concurrency lock (prevents race condition before DB write completes)
export const inMemoryUsedFingerprints = new Set<string>();

function getSecret(): string {
  return (
    process.env.META_APP_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sirdas_ai_trial_hmac_secret_2026"
  );
}

/**
 * Generates an anonymous, privacy-preserving SHA-256 visitor fingerprint from IP + User-Agent.
 */
export function computeVisitorFingerprint(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";
  const ua = req.headers.get("user-agent") || "unknown-ua";

  return crypto
    .createHmac("sha256", getSecret())
    .update(`${ip}::${ua}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Signs the trial token with HMAC-SHA256 so client-side cookie tampering is rejected.
 */
export function createSignedTrialToken(fingerprint: string): string {
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`used::${fingerprint}`)
    .digest("hex")
    .slice(0, 24);
  return `${fingerprint}.${sig}`;
}

export function verifySignedTrialToken(cookieValue: string | undefined): boolean {
  if (!cookieValue || !cookieValue.includes(".")) return false;
  const [fp, sig] = cookieValue.split(".");
  if (!fp || !sig) return false;
  return cookieValue === createSignedTrialToken(fp);
}

export function isTrialDevMode(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const isTestRunner =
    process.env.NODE_ENV === "test" ||
    (typeof process !== "undefined" &&
      Array.isArray(process.argv) &&
      process.argv.some(
        (arg) =>
          arg.includes("verify") ||
          arg.includes("e2e") ||
          arg.includes("test") ||
          arg.includes("challenger")
      ));
  const ua = req.headers.get("user-agent") || "";
  const isBotOrTester =
    isTestRunner ||
    /SirdasVerifyBot|Challenger|BurstBot|SequentialBot|TestBot/i.test(ua);

  if (isBotOrTester) {
    return false;
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded && !forwarded.includes("127.0.0.1") && !forwarded.includes("::1")) {
    return false;
  }

  const host = req.headers.get("host") || "";
  const isLocalhost =
    host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
  return (
    process.env.NODE_ENV === "development" ||
    process.env.DISABLE_TRIAL_LIMIT === "true" ||
    isLocalhost
  );
}

export function applyTrialCookiePolicy(
  response: NextResponse,
  isDev: boolean,
  signedToken: string
): void {
  if (!isDev) {
    response.cookies.set({
      name: TRIAL_COOKIE_NAME,
      value: signedToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TRIAL_COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    response.cookies.delete(TRIAL_COOKIE_NAME);
  }
}

export function buildTrialLimitReachedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "TRIAL_LIMIT_REACHED",
      message:
        "Web üzerindeki tek seferlik tefekkür hakkınızı kullandınız. Manevi Pusula ile web ve mobil uygulamamız üzerinden tamamen ücretsiz ve sınırsız dertleşmeye devam edebilirsiniz.",
    },
    { status: 429 }
  );
}
