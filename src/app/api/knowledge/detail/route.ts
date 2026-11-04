import { NextRequest, NextResponse } from "next/server";
import { resolveSourceBookDetail } from "@/lib/knowledge/source-resolver";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("id") || "";
  const sourceTitle = searchParams.get("title") || "";
  const sourceType = searchParams.get("sourceType") || "";
  const content = searchParams.get("content") || "";
  const audioUrl = searchParams.get("audioUrl") || null;

  try {
    const detail = resolveSourceBookDetail({
      sourceId,
      sourceTitle,
      sourceType,
      content,
      audioUrl,
    });

    return NextResponse.json({
      success: true,
      detail,
    });
  } catch (error) {
    console.error("[GET /api/knowledge/detail error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Kaynak detayları çözümlenemedi",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const detail = resolveSourceBookDetail({
      sourceId: body.id,
      sourceTitle: body.title || body.sourceTitle,
      sourceType: body.sourceType,
      content: body.content,
      audioUrl: body.audioUrl,
    });

    return NextResponse.json({
      success: true,
      detail,
    });
  } catch (error) {
    console.error("[POST /api/knowledge/detail error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Kaynak detayları çözümlenemedi",
      },
      { status: 500 }
    );
  }
}
