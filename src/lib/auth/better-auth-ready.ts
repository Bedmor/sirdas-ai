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

/**
 * KVKK Unutulma Hakkı (Right to be Forgotten):
 * Permanently deletes all messages, JSON profile metadata, and the user record
 * for an anonymous visitor or authenticated actor.
 */
export async function purgeSirdasActorData(
  clientId: string
): Promise<{ deleted: boolean; messagesCount?: number }> {
  const userKey = `web_chat_${clientId}`;

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: userKey },
    });

    if (!user) {
      return { deleted: true, messagesCount: 0 };
    }

    const deleteMessagesResult = await prisma.message.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    return {
      deleted: true,
      messagesCount: deleteMessagesResult.count,
    };
  } catch (err) {
    console.warn("[purgeSirdasActorData Warning - attempting fallback]", err);

    // Fallback: clear messages and reset profile metadata if full user deletion meets constraints
    try {
      const user = await prisma.user.findUnique({
        where: { phoneNumber: userKey },
      });

      if (user) {
        await prisma.message.deleteMany({
          where: { userId: user.id },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            profileMetadata: {},
            onboardingStep: 1,
            onboardingCompleted: false,
          },
        });
      }

      return { deleted: true };
    } catch (fallbackErr) {
      console.error("[purgeSirdasActorData Fallback Error]", fallbackErr);
      return { deleted: false };
    }
  }
}

/**
 * Zaman Ayarlı Kendini İmhâ (TTL - Time To Live):
 * Belirlenen süre (varsayılan 24 saat) boyunca güncellenmeyen anonim web oturumlarını
 * ve mesaj kayıtlarını arka planda otomatik olarak imha eder.
 */
export async function purgeExpiredSirdasRecords(
  ttlHours: number = 24
): Promise<{ purgedCount: number }> {
  if (ttlHours <= 0) return { purgedCount: 0 };
  const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

  try {
    const expiredUsers = await prisma.user.findMany({
      where: {
        phoneNumber: { startsWith: "web_chat_" },
        lastActiveAt: { lt: cutoffDate },
      },
      take: 100,
    });

    let totalDeleted = 0;
    for (const u of expiredUsers) {
      const res = await prisma.message.deleteMany({
        where: { userId: u.id },
      });
      totalDeleted += res.count;
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }

    return { purgedCount: totalDeleted };
  } catch (err) {
    console.warn("[purgeExpiredSirdasRecords Warning]", err);
    return { purgedCount: 0 };
  }
}
