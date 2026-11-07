import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(250, Math.max(10, parseInt(limitParam, 10))) : 100;
    const roleParam = url.searchParams.get("role");
    const searchParam = url.searchParams.get("search")?.trim().toLowerCase();

    const whereClause: Record<string, unknown> = {};
    if (roleParam && (roleParam === "USER" || roleParam === "ASSISTANT")) {
      whereClause.role = roleParam;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      take: limit,
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
    });

    const formatted = messages.map((m, idx) => {
      const profileMeta =
        m.user?.profileMetadata && typeof m.user.profileMetadata === "object"
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

      let jevMeta = (m.jevMetadata as Record<string, unknown> | null) || null;
      let editorAudit = (m.editorAudit as Record<string, unknown> | null) || null;

      // Cross-referencing: if USER message lacks editorAudit, find the answering ASSISTANT message
      if (m.role === "USER" && !editorAudit) {
        const answeringAssistant = messages.find(
          (other, oIdx) =>
            oIdx < idx &&
            other.userId === m.userId &&
            other.role === "ASSISTANT" &&
            other.editorAudit
        );
        if (answeringAssistant?.editorAudit) {
          editorAudit = answeringAssistant.editorAudit as Record<string, unknown>;
        }
      }

      // Cross-referencing: if ASSISTANT message lacks jevMetadata, find the asking USER message or derive from editorAudit
      if (m.role === "ASSISTANT" && !jevMeta) {
        const askingUser = messages.find(
          (other, oIdx) =>
            oIdx > idx &&
            other.userId === m.userId &&
            other.role === "USER" &&
            other.jevMetadata
        );
        if (askingUser?.jevMetadata) {
          jevMeta = askingUser.jevMetadata as Record<string, unknown>;
        } else if (editorAudit) {
          const deepTriage = (editorAudit.deepTriage as Record<string, unknown> | null) || null;
          jevMeta = {
            source: "sirdas_resolved",
            distress_level: deepTriage?.distressLevel ?? editorAudit.distress_level ?? 4,
            nafs_trap: deepTriage?.nafsTrap ?? editorAudit.nafs_trap ?? editorAudit.nafs_and_vesvese_addressed ?? "UMITSIZLIK_KARAMSARLIK",
            rag_category: editorAudit.rag_category ?? "TEVEKKUL_VE_MURAKABE",
            spiritual_stage: deepTriage?.spiritualStage ?? editorAudit.spiritual_stage ?? "ARAYIS_VE_BASLANGIC",
            recommended_tone: deepTriage?.recommendedTone ?? editorAudit.tone ?? "SEFKATLI_TESKIN",
            is_debt_or_riba_related: editorAudit.riba_warning_included ? 0.95 : 0.0,
            is_fiqh_fatwa_request: 0.0,
            needs_audio_snippet: m.audioSent ? 0.95 : (Number(deepTriage?.distressLevel) >= 6 ? 0.85 : 0.35),
          };
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
        jevMetadata: jevMeta,
        editorAudit,
        audioSent: m.audioSent,
        audioUrlSent: m.audioUrlSent,
      };
    });

    // Client-side text search filter if searchParam present
    const filtered = searchParam
      ? formatted.filter(
          (m) =>
            m.content.toLowerCase().includes(searchParam) ||
            m.userPhone.toLowerCase().includes(searchParam) ||
            (m.rawPhone && m.rawPhone.toLowerCase().includes(searchParam))
        )
      : formatted;

    return NextResponse.json({
      success: true,
      total: filtered.length,
      messages: filtered,
    });
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
        messages: [],
      },
      { status: 500 }
    );
  }
}
