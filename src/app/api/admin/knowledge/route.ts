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
    tags: ["TALAK_2_3", "TEVEKKUL", "CIKIS_YOLU", "RIZIK"],
    nafsTraps: ["UMITSIZLIK_VE_REHAVET", "CARESIZLIK_VEHMI"],
    isRibaRelated: false,
  },
  {
    id: "chunk-hadith-1",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Birr 69)",
    content:
      "Peygamber Efendimiz (s.a.v.) buyurdu: 'Sadaka vermekle mal eksilmez. Kul affettikçe Allah onun izzet ve şerefini artırır. Kim Allah için tevazu gösterirse, Allah onu yüceltir.'",
    tags: ["INFAK", "SADAKA", "TEVAZU", "BEREKET"],
    nafsTraps: ["CIMRILIK", "MAL_HIRSI", "KIBIR"],
    isRibaRelated: false,
  },
  {
    id: "chunk-audio-1",
    sourceType: "HALIS_AYDEMIR",
    sourceTitle: "Halis Aydemir - Tefekkür Sohbeti (Rızık ve Sebepler)",
    content:
      "Biz sebeplere hürmet ederiz, sebepleri putlaştırmayız. Kul sabah dükkanını açarken 'Rızkı bu dükkan değil, Rezzak olan Allah verecek' şuuruyla besmele çekmelidir. Sebeplere tapınmak insanı vesveseye ve telaşa boğar.",
    tags: ["RIZIK", "TEVEKKUL", "SEBEPLER", "HALIS_AYDEMIR"],
    nafsTraps: ["SEBEPLERI_PUTLASTIRMA", "GELECEK_ENDISESI"],
    isRibaRelated: false,
    youtubeId: "vB8kLm90Op",
    startSec: 120,
    endSec: 210,
    audioUrl: "https://media.sirdas.ai/halis_aydemir/rizik_ve_sebepler.ogg",
  },
  {
    id: "chunk-audio-2",
    sourceType: "HALIS_AYDEMIR",
    sourceTitle: "Halis Aydemir - Vesvese ve Kalp Huzuru",
    content:
      "Vesvese kulun kalbine atılan boş bir oltadır. Sen o oltaya takılmazsan, 'Rabbim beni işitir ve görür' dersen o vesvese bir duman gibi dağılır. Kendi içindeki o sesi Rabbinin kelamıyla sustur.",
    tags: ["VESVESE", "SEKINE", "MURAKABE", "HALIS_AYDEMIR"],
    nafsTraps: ["ICSEL_VESVESE", "SUPHE_TUZAGI"],
    isRibaRelated: false,
    youtubeId: "xY90Pq11Az",
    startSec: 340,
    endSec: 435,
    audioUrl: "https://media.sirdas.ai/halis_aydemir/vesvese_ve_sekine.ogg",
  },
  {
    id: "chunk-siyer-1",
    sourceType: "SIYER",
    sourceTitle: "Taif Dönüşü Hz. Peygamber'in (s.a.v.) İhlas Duası",
    content:
      "Allah'ım! Güçsüzlüğümü, zaafımı ve insanların gözündeki değersizliğimi Sana arz ediyorum. Ey merhametlilerin en merhametlisi! Beni kime bırakıyorsun? Bana kaba davranan bir yabancıya mı, yoksa emrimi eline verdiğin bir düşmana mı? Eğer bana karşı bir gazabın yoksa, çektiğim sıkıntılara aldırmam...",
    tags: ["TAIF", "SIYER", "TESLIMIYET", "DUA"],
    nafsTraps: ["SITEM", "ISYAN_MEYLI", "SABIRSIZLIK"],
    isRibaRelated: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType");
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

    if (!chunks || chunks.length === 0) {
      chunks = SEED_KNOWLEDGE_CHUNKS;
    }

    let filtered = chunks;
    if (sourceType && sourceType !== "ALL") {
      filtered = filtered.filter((c) => c.sourceType === sourceType);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.sourceTitle.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.tags.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("Knowledge chunks API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch knowledge chunks" },
      { status: 500 }
    );
  }
}
