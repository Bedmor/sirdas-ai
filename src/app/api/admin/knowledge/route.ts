import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const SEED_KNOWLEDGE_CHUNKS = [
  {
    id: "chunk-quran-1",
    sourceType: "QURAN",
    sourceTitle: "Bakara Suresi 275-279",
    content:
      "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar. Bu onların 'Alışveriş de faiz gibidir' demelerindendir. Oysa Allah alışverişi helal, faizi haram kılmıştır. Kime Rabbinden bir öğüt gelir de faizden vazgeçerse geçmişi kendisine aittir... Eğer faizden vazgeçmezseniz Allah ve Resulü tarafından açılmış bir harbi bilin!",
    tags: ["BAKARA_275_279", "RIBA", "HARAM", "RIZIK_VE_TICARET"],
    nafsTraps: ["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"],
    isRibaRelated: true,
  },
  {
    id: "chunk-quran-2",
    sourceType: "QURAN",
    sourceTitle: "Talâk Suresi 2-3",
    content:
      "Kim Allah'tan korkup sakınırsa, Allah ona bir çıkış yolu açar ve onu beklemediği yerden rızıklandırır. Kim Allah'a tevekkül ederse, O kendisine yeter. Şüphesiz Allah, emrini yerine getirendir.",
    tags: ["TALAK_2_3", "TEVEKKUL_VE_MURAKABE", "CIKIS_YOLU", "RIZIK_VE_TICARET"],
    nafsTraps: ["UMITSIZLIK_KARAMSARLIK", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
    isRibaRelated: false,
  },
  {
    id: "chunk-hadith-1",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Birr 69)",
    content:
      "Peygamber Efendimiz (s.a.v.) buyurdu: 'Sadaka vermekle mal eksilmez. Kul affettikçe Allah onun izzet ve şerefini artırır. Kim Allah için tevazu gösterirse, Allah onu yüceltir.'",
    tags: ["INFAK", "SADAKA", "ISRAF_VE_IKTISAT_FIKHI", "KALP_AMELLELI_VE_IHLAS"],
    nafsTraps: ["CIMRILIK_VE_MAL_HIRSI", "MINNET_VE_BASA_KAKMA", "GIZLI_KIBIR_HAKLILIK"],
    isRibaRelated: false,
  },
  {
    id: "chunk-siyer-1",
    sourceType: "SIYER",
    sourceTitle: "Taif Dönüşü Hz. Peygamber'in (s.a.v.) İhlas Duası",
    content:
      "Allah'ım! Güçsüzlüğümü, zaafımı ve insanların gözündeki değersizliğimi Sana arz ediyorum. Ey merhametlilerin en merhametlisi! Beni kime bırakıyorsun? Bana kaba davranan bir yabancıya mı, yoksa emrimi eline verdiğin bir düşmana mı? Eğer bana karşı bir gazabın yoksa, çektiğim sıkıntılara aldırmam...",
    tags: ["TAIF", "SIYERDE_DARLIK_DONEMLERI", "DUA_VE_ILCA_USULU", "KADER_VE_KAZA_HIKMETI"],
    nafsTraps: ["KADERE_ITIRAZ_VE_ISYAN", "ACELECI_TALEPLER_VE_ISTIACAL"],
    isRibaRelated: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType") || searchParams.get("category");
    const search = searchParams.get("search");

    let chunks: Array<any> = [];

    try {
      const whereClause: any = {};
      if (sourceType && sourceType !== "ALL") {
        whereClause.sourceType = sourceType;
      }

      chunks = await prisma.knowledgeChunk.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (dbErr) {
      console.warn("DB knowledge chunks fallback:", dbErr);
    }

    const seedIds = new Set(chunks.map((c) => c.id));
    const missingSeeds = SEED_KNOWLEDGE_CHUNKS.filter((s) => !seedIds.has(s.id));
    chunks = [...chunks, ...missingSeeds];

    let filtered = chunks.map((c) => ({
      ...c,
      category: c.category || c.sourceType,
    }));

    if (sourceType && sourceType !== "ALL") {
      filtered = filtered.filter(
        (c) => c.sourceType === sourceType || (c as any).category === sourceType
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.sourceTitle?.toLowerCase().includes(q) ||
          c.content?.toLowerCase().includes(q) ||
          (Array.isArray(c.tags) && c.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
      chunks: filtered,
    });
  } catch (error) {
    console.error("Knowledge chunks API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch knowledge chunks" },
      { status: 500 }
    );
  }
}
