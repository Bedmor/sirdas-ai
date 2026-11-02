import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const START_TIME = Date.now();

export async function GET() {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatencyMs = -1;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "connected";
  } catch (err) {
    console.error("Health check DB probe failed:", err);
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      version: "0.1.0",
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        gemini: {
          model: "gemini-3.8-flash",
          configured: geminiConfigured,
        },
        platform: {
          channels: ["web", "mobile"],
          status: "active",
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
