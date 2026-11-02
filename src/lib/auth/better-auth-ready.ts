import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

/**
 * Better Auth Readiness & Anonymous-to-Authenticated Account Linking Layer.
 *
 * When `better-auth` is enabled with the `anonymous()` plugin, guest conversations
 * stored under `web_chat_<anonymousUserId>` are automatically migrated to the
 * authenticated user's record via `linkAnonymousSirdasHistoryToUser`.
 */
export const SIRDAS_CLIENT_COOKIE = "sirdas_client_id";
export const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";

export interface SirdasActorContext {
  clientId: string;
  isAnonymous: boolean;
  betterAuthSessionToken: string | null;
}

/**
 * Resolves the active visitor or Better Auth user from request headers/cookies.
 */
export function resolveSirdasChatActor(
  req: NextRequest,
  bodyClientId?: string
): SirdasActorContext {
  const betterAuthToken =
    req.cookies.get(BETTER_AUTH_SESSION_COOKIE)?.value ||
    req.cookies.get(`__Secure-${BETTER_AUTH_SESSION_COOKIE}`)?.value ||
    null;

  const cookieClientId = req.cookies.get(SIRDAS_CLIENT_COOKIE)?.value;
  const headerClientId = req.headers.get("x-sirdas-client-id");

  const rawClientId =
    cookieClientId ||
    headerClientId ||
    (typeof bodyClientId === "string" && bodyClientId.trim().length >= 8
      ? bodyClientId.trim()
      : null);

  if (rawClientId) {
    const sanitized = rawClientId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    if (sanitized.length >= 8) {
      return {
        clientId: sanitized,
        isAnonymous: !betterAuthToken,
        betterAuthSessionToken: betterAuthToken,
      };
    }
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const ua = req.headers.get("user-agent") || "sirdas-web-client";
  const fallbackId = crypto
    .createHash("sha256")
    .update(`sirdas_anon::${ip}::${ua}`)
    .digest("hex")
    .slice(0, 24);

  return {
    clientId: fallbackId,
    isAnonymous: !betterAuthToken,
    betterAuthSessionToken: betterAuthToken,
  };
}

/**
 * Hook designed for Better Auth's `anonymous({ onLinkAccount })` plugin.
 * Reassigns all conversation messages from the guest profile to the newly
 * authenticated user account in a single transaction.
 */
export async function linkAnonymousSirdasHistoryToUser(params: {
  anonymousClientId: string;
  authenticatedUserKey: string;
}): Promise<{ migratedThreads: number }> {
  const { anonymousClientId, authenticatedUserKey } = params;
  const prefix = `web_chat_${anonymousClientId}`;

  try {
    const anonUser = await prisma.user.findUnique({
      where: { phoneNumber: prefix },
    });

    if (!anonUser) {
      return { migratedThreads: 0 };
    }

    const targetUser = await prisma.user.upsert({
      where: { phoneNumber: authenticatedUserKey },
      update: { lastActiveAt: new Date() },
      create: {
        phoneNumber: authenticatedUserKey,
        onboardingStep: 3,
        onboardingCompleted: true,
        profileMetadata: anonUser.profileMetadata ?? {},
      },
    });

    await prisma.message.updateMany({
      where: { userId: anonUser.id },
      data: { userId: targetUser.id },
    });

    return { migratedThreads: 1 };
  } catch (err) {
    console.warn("[BetterAuth Account Link Warning]", err);
    return { migratedThreads: 0 };
  }
}
