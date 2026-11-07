import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Execute queries in parallel with error handling
    const [
      totalUsers,
      activeTodayCount,
      totalMessages,
      todayMessages,
      totalChunks,
      donationsAggregate,
      recentMessages,
      recentDonations,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user
        .count({
          where: {
            lastActiveAt: { gte: startOfToday },
          },
        })
        .catch(() => 0),
      prisma.message.count().catch(() => 0),
      prisma.message
        .count({
          where: {
            createdAt: { gte: startOfToday },
          },
        })
        .catch(() => 0),
      prisma.knowledgeChunk.count().catch(() => 0),
      prisma.donation
        .aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true },
          _count: { id: true },
        })
        .catch(() => ({ _sum: { amount: null }, _count: { id: 0 } })),
      prisma.message
        .findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                phoneNumber: true,
                profileMetadata: true,
                onboardingStep: true,
                onboardingCompleted: true,
              },
            },
          },
        })
        .catch(() => []),
      prisma.donation
        .findMany({
          take: 15,
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []),
    ]);

    const totalDonationAmount = Number(donationsAggregate._sum.amount || 0);
    const totalDonationCount = donationsAggregate._count.id;
    const activeConversations = Math.min(
      totalUsers,
      Math.max(activeTodayCount, Math.round(todayMessages / 2) || (totalUsers > 0 ? 1 : 0))
    );

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeToday: activeTodayCount,
        },
        conversations: {
          active: activeConversations,
        },
        messages: {
          total: totalMessages,
          today: todayMessages,
        },
        donations: {
          poolBalance: totalDonationAmount,
          totalCount: totalDonationCount,
          sponsoredMessagesCount: Math.round(totalDonationAmount),
        },
        knowledge: {
          totalChunks,
        },
        recentMessages: recentMessages.map((m) => {
          const profileMeta =
            m.user?.profileMetadata &&
            typeof m.user.profileMetadata === "object"
              ? (m.user.profileMetadata as Record<string, unknown>)
              : null;
          const preferredName =
            typeof profileMeta?.preferred_name === "string" &&
            profileMeta.preferred_name.trim()
              ? profileMeta.preferred_name.trim()
              : null;

          let displayPhone = "Kayıtlı Üye";
          if (m.user?.phoneNumber) {
            const raw = m.user.phoneNumber;
            if (raw.startsWith("web_chat_")) {
              const memberShortId = raw.replace("web_chat_", "").slice(0, 6);
              displayPhone = preferredName
                ? `${preferredName} • Üye #${memberShortId}`
                : `Üye • #${memberShortId}`;
            } else if (raw.startsWith("web_trial_")) {
              displayPhone = "Landing Deneme • " + raw.replace("web_trial_", "").slice(0, 6);
            } else if (raw.length > 6) {
              const masked = raw.slice(0, 4) + "•••" + raw.slice(-2);
              displayPhone = preferredName ? `${preferredName} (${masked})` : masked;
            } else {
              displayPhone = preferredName ? `${preferredName} (${raw})` : raw;
            }
          }
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            userPhone: displayPhone,
            rawPhone: m.user?.phoneNumber || null,
            userProfile: profileMeta,
            onboardingStep: m.user?.onboardingStep ?? 1,
            onboardingCompleted: m.user?.onboardingCompleted ?? false,
            jevMetadata: m.jevMetadata,
            editorAudit: m.editorAudit,
            audioSent: m.audioSent,
          };
        }),
        recentDonations: recentDonations.map((d) => ({
          id: d.id,
          donorName: d.donorName || "Gönüllü İnfak Sahibi",
          amount: Number(d.amount),
          currency: d.currency,
          status: d.status,
          provider: d.paymentProvider,
          createdAt: d.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json({
      success: true,
      isFallback: true,
      data: {
        users: { total: 0, activeToday: 0 },
        conversations: { active: 0 },
        messages: { total: 0, today: 0 },
        donations: {
          poolBalance: 0,
          totalCount: 0,
          sponsoredMessagesCount: 0,
        },
        knowledge: { totalChunks: 0 },
        recentMessages: [],
        recentDonations: [],
      },
    });
  }
}
