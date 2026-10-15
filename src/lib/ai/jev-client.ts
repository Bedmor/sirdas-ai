export interface JevAnalysisRequest {
  userMessage: string;
  userContextSnippet?: string;
}

export type NafsTrap =
  | "FAIRLIK_KORKUSU_VESVESESI"
  | "GIZLI_KIBIR_HAKLILIK"
  | "UMITSIZLIK_KARAMSARLIK"
  | "INTIKAM_VE_HASET"
  | "ELALEM_NE_DER_RIYA"
  | "REHAVET_TEMBELLIK";

export type RagCategory =
  | "RIZIK_VE_TICARET"
  | "SABIR_VE_MUSIBET"
  | "OFKE_VE_AHLAK"
  | "AILE_VE_SILA_I_RAHIM"
  | "KUL_HAKKI_VE_ADALET"
  | "TEVEKKUL_VE_MURAKABE"
  | "SIYER_ORNEKLERI";

export interface JevAnalysisResult {
  is_fiqh_fatwa_request: number; // >= 0.75 ise Gemini bypass, fetva engeli dön
  is_debt_or_riba_related: number; // >= 0.60 ise Riba Kalkanı aktif
  needs_audio_snippet: number; // >= 0.70 ise Halis hoca ses kesiti ara
  nafs_trap: NafsTrap;
  rag_category: RagCategory;
  distress_level: number; // 0-10, >= 8 ise şefkate yumuşat
}

export const FATWA_REJECTION_MESSAGE =
  "Ben fıkhi bir merci veya fetva makamı değilim. Bu sorunuzun şer'i/hukuki hükmü (helal/haram/caiz/boşanma/miras) için Diyanet İşleri Başkanlığı'na (Alo 190) veya liyakatli ehliyet sahibi müftülüklere danışabilirsiniz.\n\n" +
  "Ancak bu sürecin ruhunuzda, ailenizde veya iç dünyanızda oluşturduğu ağırlık, imtihan ve tevekkül boyutu üzerine dertleşebiliriz.";

export const CRISIS_EMERGENCY_MESSAGE =
  "Gönlünüzdeki yangını ve hissettiğiniz derin acıyı duyuyorum aziz kardeşim. Şu an hiçbir yükü tek başınıza omuzlamak zorunda değilsiniz.\n\n" +
  "Lütfen hemen 112 Acil Çağrı Merkezini arayarak uzman bir destek alınız. Yanınızda olan, sizi dinlemeye hazır insanlar ve her an sizinle olan Rahman bir Rabbiniz var. Canınız mukaddes bir emanettir, lütfen yardım almaktan çekinmeyiniz.";

export async function analyzeWithJev(params: JevAnalysisRequest): Promise<JevAnalysisResult> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const typeSafeApiKey = process.env.TYPESAFE_API_KEY;

  if (!openRouterApiKey && !typeSafeApiKey) {
    return runHeuristicFallback(params.userMessage);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5 saniye SLA

    const endpoint = openRouterApiKey
      ? (process.env.OPENROUTER_DECISIONS_URL || "https://openrouter.ai/api/alpha/decisions")
      : (process.env.TYPESAFE_BASE_URL || "https://api.typesafe.ai/v1/system-one");

    const model = process.env.OPENROUTER_DECISIONS_MODEL || "typesafe/jev-1.14";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterApiKey || typeSafeApiKey}`,
      "HTTP-Referer": "https://sirdas.ai",
      "X-Title": "Sirdas AI Zakir"
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        state: {
          message: params.userMessage,
          context: params.userContextSnippet || ""
        },
        questions: {
          is_fiqh_fatwa_request: {
            type: "noul",
            instructions: "Kullanıcı miras, nikah, boşanma, ticaret akdi veya ibadet kuralları hakkında bağlayıcı helal/haram/caiz hükmü (fetva) soruyor mu?",
            criteria: {
              true: "Kullanıcı fıkhi/hukuki bağlayıcı bir fetva hükmü istiyor.",
              false: "Kullanıcı genel dertleşme, ahlaki öğüt veya manevi teskin arıyor."
            }
          },
          is_debt_or_riba_related: {
            type: "noul",
            instructions: "Kullanıcı borç, kredi kartı, banka kredisi, faiz sarmalı veya maddi çıkmazdan bahsediyor mu?",
            criteria: {
              true: "Kullanıcı borç, faiz, kredi veya mali darlık içinde.",
              false: "Borç ve faizle ilgisi olmayan başka bir konu."
            }
          },
          needs_audio_snippet: {
            type: "noul",
            instructions: "Kullanıcıya yazılı cevabın yanında Halis Aydemir hocanın 1-2 dakikalık sesli tefekkür kesitini göndermek manevi olarak faydalı olur mu?",
            criteria: {
              true: "Kullanıcının hali derin bir sesli tefekkür ve nasihat gerektiriyor.",
              false: "Yalnızca yazılı kısa mesaj kafi."
            }
          },
          nafs_trap: {
            type: "choice",
            instructions: "Kullanıcının ifadelerinde en belirgin nefis tuzağı veya şeytan vesvesesi hangisidir?",
            criteria: {
              FAIRLIK_KORKUSU_VESVESESI: "Fakirlikle korkutma ve rızık endişesi",
              GIZLI_KIBIR_HAKLILIK: "Kendini haklı görme, karşı tarafı suçlama ve gizli kibir",
              UMITSIZLIK_KARAMSARLIK: "Çaresizlik, bataklık hissi ve ümitsizlik",
              INTIKAM_VE_HASET: "Öfke, kin, intikam veya kıskançlık",
              ELALEM_NE_DER_RIYA: "İnsanların onayını arama, elalem putu",
              REHAVET_TEMBELLIK: "Erteleme, tembellik ve mesuliyetten kaçış"
            }
          },
          rag_category: {
            type: "choice",
            instructions: "Bu mesele hangi manevi rehberlik alanına aittir?",
            criteria: {
              RIZIK_VE_TICARET: "Rızık, iş, ticaret ve bereket",
              SABIR_VE_MUSIBET: "Musibet, dert, hastalık ve sabır",
              OFKE_VE_AHLAK: "Öfke kontrolü, ahlak ve nefs terbiyesi",
              AILE_VE_SILA_I_RAHIM: "Aile, evlilik, anne-baba ve akraba ilişkileri",
              KUL_HAKKI_VE_ADALET: "Kul hakkı, adalet ve emanet",
              TEVEKKUL_VE_MURAKABE: "Tevekkül, murakabe ve Allah ile irtibat",
              SIYER_ORNEKLERI: "Peygamberimiz ve ashabın hayatından ibretler"
            }
          },
          distress_level: {
            type: "score",
            instructions: "Kullanıcının ruhsal çöküş, bunalım ve çaresizlik şiddeti nedir?",
            criteria: {
              "0": "Sakin, huzurlu ve mutmain",
              "3": "Hafif endişe veya can sıkıntısı",
              "6": "Belirgin sıkıntı, darlık ve hüzün",
              "8": "Ağır tükenmişlik, ruhsal bunalım ve yoğun keder",
              "10": "Uç noktada çaresizlik, yıkım veya varoluşsal kriz"
            }
          }
        }
      })
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Jev / OpenRouter Decisions API Error: HTTP ${res.status}], fallback devreye girdi.`);
      return runHeuristicFallback(params.userMessage);
    }

    const data = await res.json();
    const answers = data.answers || data;

    const extractNoul = (field: any): number => {
      if (typeof field === "number") return field;
      if (typeof field?.noul === "number") return field.noul;
      if (typeof field?.probability === "number") return field.probability;
      if (typeof field?.value === "number") return field.value;
      return 0.0;
    };

    const extractChoice = (field: any, defaultVal: string): string => {
      if (typeof field === "string") return field;
      if (typeof field?.choice === "string") return field.choice;
      if (typeof field?.value === "string") return field.value;
      return defaultVal;
    };

    const extractScore = (field: any, defaultVal: number): number => {
      if (typeof field === "number") return field;
      if (typeof field?.score === "number") return field.score;
      if (typeof field?.value === "number") return field.value;
      return defaultVal;
    };

    return {
      is_fiqh_fatwa_request: extractNoul(answers.is_fiqh_fatwa_request),
      is_debt_or_riba_related: extractNoul(answers.is_debt_or_riba_related),
      needs_audio_snippet: extractNoul(answers.needs_audio_snippet),
      nafs_trap: extractChoice(answers.nafs_trap, "UMITSIZLIK_KARAMSARLIK") as NafsTrap,
      rag_category: extractChoice(answers.rag_category, "TEVEKKUL_VE_MURAKABE") as RagCategory,
      distress_level: Math.round(extractScore(answers.distress_level, 4))
    };
  } catch (error) {
    console.error("[Jev API Fetch Error]", error);
    return runHeuristicFallback(params.userMessage);
  }
}

// Ağ/timeout durumlarında sistemin durmasını engelleyen kural tabanlı emniyet motoru
export function runHeuristicFallback(text: string): JevAnalysisResult {
  const lower = text.toLowerCase();

  const fatwaKeywords = [
    "boşan",
    "talak",
    "nikah düştü",
    "miras",
    "haram mı",
    "helal mi",
    "caiz mi",
    "abdest bozulur mu",
    "orucum bozuldu",
    "fetva",
    "hükmü nedir"
  ];
  const ribaKeywords = [
    "kredi",
    "faiz",
    "borç",
    "icra",
    "tefeci",
    "kart borcu",
    "banka faizi",
    "kredi kartı",
    "gecikme faizi"
  ];
  const extremeDistressKeywords = [
    "intihar",
    "ölmek istiyorum",
    "yaşamak istemiyorum",
    "canıma kıyacağım",
    "kendimi öldür"
  ];
  const highDistressKeywords = [
    "dayanamıyorum",
    "bıktım",
    "tükendim",
    "mahvoldum",
    "çıldıracağım",
    "tükendim",
    "boğuluyorum",
    "nefes alamıyorum"
  ];

  const isFatwa = fatwaKeywords.some(k => lower.includes(k)) ? 0.88 : 0.05;
  const isRiba = ribaKeywords.some(k => lower.includes(k)) ? 0.85 : 0.05;

  let distressLevel = 4;
  if (extremeDistressKeywords.some(k => lower.includes(k))) {
    distressLevel = 10;
  } else if (highDistressKeywords.some(k => lower.includes(k))) {
    distressLevel = 8;
  }

  // Nafs trap heuristiği
  let nafsTrap: NafsTrap = "UMITSIZLIK_KARAMSARLIK";
  let ragCategory: RagCategory = "TEVEKKUL_VE_MURAKABE";

  if (isRiba > 0.5) {
    nafsTrap = "FAIRLIK_KORKUSU_VESVESESI";
    ragCategory = "RIZIK_VE_TICARET";
  } else if (lower.includes("öfke") || lower.includes("haksız") || lower.includes("kin")) {
    nafsTrap = "INTIKAM_VE_HASET";
    ragCategory = "OFKE_VE_AHLAK";
  } else if (lower.includes("elalem") || lower.includes("insanlar") || lower.includes("rezil")) {
    nafsTrap = "ELALEM_NE_DER_RIYA";
    ragCategory = "KUL_HAKKI_VE_ADALET";
  } else if (lower.includes("sabır") || lower.includes("hastalık") || lower.includes("kayıp")) {
    nafsTrap = "UMITSIZLIK_KARAMSARLIK";
    ragCategory = "SABIR_VE_MUSIBET";
  }

  return {
    is_fiqh_fatwa_request: isFatwa,
    is_debt_or_riba_related: isRiba,
    needs_audio_snippet: 0.75,
    nafs_trap: nafsTrap,
    rag_category: ragCategory,
    distress_level: distressLevel
  };
}
