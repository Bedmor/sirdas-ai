import "dotenv/config";
import {
  JevAnalysisRequest,
  JevAnalysisResult,
  NafsTrap,
  RagCategory,
  TonePreference,
  SpiritualStage,
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
  TONE_PREFERENCE_CRITERIA,
  SPIRITUAL_STAGE_CRITERIA,
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  VIOLENCE_EMERGENCY_MESSAGE,
  VICTIM_EMERGENCY_MESSAGE,
  FATWA_KEYWORDS,
  RIBA_KEYWORDS,
  HEURISTIC_TOPIC_RULES,
} from "./jev-taxonomy";

export type {
  JevAnalysisRequest,
  JevAnalysisResult,
  NafsTrap,
  RagCategory,
  TonePreference,
  SpiritualStage,
};

export {
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
  TONE_PREFERENCE_CRITERIA,
  SPIRITUAL_STAGE_CRITERIA,
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  VIOLENCE_EMERGENCY_MESSAGE,
  VICTIM_EMERGENCY_MESSAGE,
};

export function normalizeRagCategory(category: string): RagCategory {
  if (category === "KALP_AMELLELI_VE_IHLAS") return "KALP_AMELLERI_VE_IHLAS";
  return (category as RagCategory) || "TEVEKKUL_VE_MURAKABE";
}

export function normalizeNafsTrap(trap: string): NafsTrap {
  if (trap === "FAIRLIK_KORKUSU_VESVESESI") return "FAKIRLIK_KORKUSU_VESVESESI";
  return (trap as NafsTrap) || "UMITSIZLIK_KARAMSARLIK";
}

const SUICIDE_CRISIS_PATTERNS: ReadonlyArray<RegExp> = [
  /intihar/i,
  /ölmek istiyorum/i,
  /olmek istiyorum/i,
  /ya[şs]amak istemiyorum/i,
  /can[ıi]ma k[ıi]y/i,
  /kendimi öldür/i,
  /kendimi oldur/i,
  /kendimi as/i,
  /hayat[ıi]ma son ver/i,
  /ölsem de kurtulsam/i,
  /olsem de kurtulsam/i,
  /kendimi yok ed/i,
  /kendimi vur/i,
  /kendimi kes/i,
  /ya[şs]amam[ıi]n anlam[ıi] yok/i,
  /ölümü diledim/i,
  /ölmek için/i,
  /can[ıi]m[ıi] almak istiyorum/i,
];

const VICTIM_PATTERNS: ReadonlyArray<RegExp> = [
  /kocam beni döv/i,
  /e[şs]im beni döv/i,
  /kocam beni dov/i,
  /e[şs]im beni dov/i,
  /babam beni döv/i,
  /babam beni dov/i,
  /abim beni döv/i,
  /abim beni dov/i,
  /dayak yiyorum/i,
  /dayak yedim/i,
  /dayak yiycem/i,
  /dayak yiyece[ğg]im/i,
  /darp ediliyorum/i,
  /darp edildim/i,
  /[şs]iddet görüyorum/i,
  /[şs]iddet gordum/i,
  /[şs]iddet gördüm/i,
  /[şs]iddete u[ğg]r/i,
  /[şs]iddete maruz/i,
  /beni dövüyor/i,
  /beni dovor/i,
  /beni dövdü/i,
  /bana vuruyor/i,
  /bana vurur/i,
  /beni öldürecek/i,
  /bana [şs]iddet uygul/i,
  /can güvenli[ğg]im yok/i,
  /can guvenligim yok/i,
  /hayat[ıi]m tehlikede/i,
  /beni darp etti/i,
  /bana tokat att[ıi]/i,
  /bo[ğg]az[ıi]m[ıi] s[ıi]kt[ıi]/i,
  /b[ıi][çc]ak [çc]ekti/i,
  /fiziksel [şs]iddet/i,
  /kades/i,
  /can[ıi]ma kasted/i,
  /ölümle tehdit/i,
  /olumle tehdit/i,
  /öldürmekle tehdit/i,
  /bana zarar ver/i,
  /tehdit ediliyorum/i,
];

const PERPETRATOR_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:kar[ıi]m[ıi]|e[şs]imi|kocam[ıi]|kad[ıi]n[ıi]|[çc]ocu[ğg]u|annemi|k[ıi]z[ıi]m[ıi]|birini|adam[ıi]|onu)\s+(?:döv|dov|vur|öldür|oldur|b[ıi][çc]akla|geber|darp|bo[ğg]|tokat|patakla)/i,
  /(?:dövücem|dövece[ğg]im|dövecem|döveyim|dövmek istiyorum|dövsem|dövesim var|dövsem mi)/i,
  /(?:dovucem|dovecegim|dovecem|dovmek istiyorum)/i,
  /(?:dayak ataca[ğg]ım|dayak atacam|dayak at[ıi]cam|dayak [çc]ek|dayak atas[ıi]m)/i,
  /(?:darp edece[ğg]im|darp edecem|darp edicem)/i,
  /[şs]iddet uygulayaca[ğg]ım|[şs]iddet uygulacam|[şs]iddet uygul[ıi]cam|[şs]iddet uygulay[ıi]m/i,
  /(?:kemiklerini|a[ğg]z[ıi]n[ıi] burnunu|kafas[ıi]n[ıi])\s+(?:k[ıi]raca|da[ğg][ıi]taca|patlataca)/i,
  /(?:hastanelik edece[ğg]im|hastanelik edicem)/i,
  /(?:can[ıi]n[ıi] yakaca[ğg]ım|can[ıi]n[ıi] yak[ıi]cam)/i,
  /(?:kar[ıi]m[ıi]|e[şs]imi|kad[ıi]n[ıi]|[çc]ocu[ğg]u|birini)\s+(?:öldür|oldur|geber)/i,
];

const DIRECT_VIOLENCE_ACTIONS: ReadonlyArray<string> = [
  "dövücem",
  "döveceğim",
  "dövecem",
  "dovucem",
  "dovecegim",
  "dövesim var",
  "dövsem mi",
  "öldüreceğim",
  "öldürücem",
  "oldurecegim",
  "oldurucem",
  "geberteceğim",
  "geberticem",
  "bıçaklayacağım",
  "bıçaklıycam",
  "bicaklayacagim",
  "pataklayacağım",
  "pataklayacam",
];

const EXTREME_DISTRESS_KEYWORDS: ReadonlyArray<string> = [
  "intihar",
  "ölmek istiyorum",
  "olmek istiyorum",
  "yaşamak istemiyorum",
  "yasamak istemiyorum",
  "canıma kıyacağım",
  "canima kiyacagim",
  "kendimi öldür",
  "kendimi oldur",
  "kendimi asmak",
  "hayatıma son vermek",
  "ölsem de kurtulsam",
];

const HIGH_DISTRESS_KEYWORDS: ReadonlyArray<string> = [
  "dayanamıyorum",
  "bıktım",
  "tükendim",
  "mahvoldum",
  "çıldıracağım",
  "boğuluyorum",
  "nefes alamıyorum",
];

/**
 * Zero-latency existential crisis & suicide detection guardrail.
 */
export function checkCrisisAndSuicide(text: string): {
  isCrisis: boolean;
  message: string;
} | null {
  if (!text) return null;
  const lower = text.toLowerCase().replace(/['"`]/g, "");

  if (SUICIDE_CRISIS_PATTERNS.some((pattern) => pattern.test(lower))) {
    return {
      isCrisis: true,
      message: CRISIS_EMERGENCY_MESSAGE,
    };
  }

  return null;
}

/**
 * Zero-latency domestic abuse & physical violence detection guardrail.
 */
export function checkViolenceAndAbuse(text: string): {
  isViolence: boolean;
  isVictim: boolean;
  message: string;
} | null {
  if (!text) return null;
  const lower = text.toLowerCase().replace(/['"`]/g, "");

  if (VICTIM_PATTERNS.some((pattern) => pattern.test(lower))) {
    return {
      isViolence: true,
      isVictim: true,
      message: VICTIM_EMERGENCY_MESSAGE,
    };
  }

  const isFatwaQuery =
    /caiz mi|hükmü nedir|günah mı|helal mi|haram mı/i.test(lower);
  const hasPerpetratorPattern = PERPETRATOR_PATTERNS.some((pattern) =>
    pattern.test(lower)
  );
  const hasDirectAction = DIRECT_VIOLENCE_ACTIONS.some((word) =>
    lower.includes(word)
  );

  if ((hasPerpetratorPattern || hasDirectAction) && !isFatwaQuery) {
    return {
      isViolence: true,
      isVictim: false,
      message: VIOLENCE_EMERGENCY_MESSAGE,
    };
  }

  return null;
}

export async function analyzeWithJev(
  params: JevAnalysisRequest
): Promise<JevAnalysisResult> {
  return runHeuristicFallback(params.userMessage);
}

/**
 * Rule-based System 1 reflex classifier driven by the declarative HEURISTIC_TOPIC_RULES table.
 */
export function runHeuristicFallback(text: string): JevAnalysisResult {
  const lower = text.toLowerCase();
  const violenceCheck = checkViolenceAndAbuse(text);
  const crisisCheck = checkCrisisAndSuicide(text);

  const isFatwa = FATWA_KEYWORDS.some((k) => lower.includes(k)) ? 0.88 : 0.05;
  const isRiba = RIBA_KEYWORDS.some((k) => lower.includes(k)) ? 0.85 : 0.05;

  let distressLevel = 4;
  if (
    violenceCheck ||
    crisisCheck ||
    EXTREME_DISTRESS_KEYWORDS.some((k) => lower.includes(k))
  ) {
    distressLevel = 10;
  } else if (HIGH_DISTRESS_KEYWORDS.some((k) => lower.includes(k))) {
    distressLevel = 8;
  }

  let nafsTrap: NafsTrap = "UMITSIZLIK_KARAMSARLIK";
  let ragCategory: RagCategory = "TEVEKKUL_VE_MURAKABE";
  let recommendedTone: TonePreference = "SEFKATLI_TESKIN";
  let spiritualStage: SpiritualStage =
    distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC";

  if (isRiba > 0.5) {
    nafsTrap = "FAKIRLIK_KORKUSU_VESVESESI";
    ragCategory = "RIZIK_VE_TICARET";
    recommendedTone = distressLevel >= 8 ? "SEFKATLI_TESKIN" : "NET_VE_MUALLIM";
  } else {
    const matchedRule = HEURISTIC_TOPIC_RULES.find((rule) =>
      rule.keywords.some((kw) => lower.includes(kw))
    );
    if (matchedRule) {
      nafsTrap = matchedRule.nafsTrap;
      ragCategory = matchedRule.ragCategory;
      if (matchedRule.recommendedTone) {
        recommendedTone = matchedRule.recommendedTone;
      }
      if (matchedRule.spiritualStage) {
        spiritualStage = matchedRule.spiritualStage;
      }
    }
  }

  if (
    lower.includes("murakabe") ||
    lower.includes("tefekkür") ||
    lower.includes("ihlas") ||
    lower.includes("rabıta")
  ) {
    spiritualStage = "DERINLESMIS_SALIK";
  }

  return {
    is_fiqh_fatwa_request: isFatwa,
    is_debt_or_riba_related: isRiba,
    needs_audio_snippet: 0.75,
    nafs_trap: violenceCheck ? "INTIKAM_VE_HASET" : nafsTrap,
    rag_category: violenceCheck ? "OFKE_VE_AHLAK" : ragCategory,
    distress_level: distressLevel,
    recommended_tone: recommendedTone,
    spiritual_stage: spiritualStage,
    is_violence_or_abuse: violenceCheck ? 1.0 : 0.0,
    violence_type: violenceCheck
      ? violenceCheck.isVictim
        ? "victim"
        : "perpetrator"
      : undefined,
    is_extreme_crisis: crisisCheck ? 1.0 : 0.0,
  };
}
