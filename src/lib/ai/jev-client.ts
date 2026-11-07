import "dotenv/config";
import {
  JevAnalysisRequest,
  JevAnalysisResult,
  NafsTrap,
  RagCategory,
  TonePreference,
  SessionMood,
  SpiritualStage,
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
  TONE_PREFERENCE_CRITERIA,
  SESSION_MOOD_DIRECTIVES,
  SPIRITUAL_STAGE_CRITERIA,
  FATWA_REJECTION_MESSAGE,
  CRISIS_EMERGENCY_MESSAGE,
  VIOLENCE_EMERGENCY_MESSAGE,
  VICTIM_EMERGENCY_MESSAGE,
  FATWA_KEYWORDS,
  RIBA_KEYWORDS,
  HEURISTIC_TOPIC_RULES,
} from "./jev-taxonomy";
import { detectIlmihalWorshipQuery } from "./adversarial-guardrails";

export type {
  JevAnalysisRequest,
  JevAnalysisResult,
  NafsTrap,
  RagCategory,
  TonePreference,
  SessionMood,
  SpiritualStage,
};

export {
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
  TONE_PREFERENCE_CRITERIA,
  SESSION_MOOD_DIRECTIVES,
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
  /ya[şs]aman[ıi]n\s*(?:bir\s*)?anlam[ıi]\s*(?:kalmad[ıi]|yok)/i,
  /ya[şs]amak\s*(?:art[ıi]k\s*)?(?:[çc]ok\s*)?a[ğg][ıi]r\s*gel/i,
  /ya[şs]amak\s*istemez\s*oldum/i,
  /bir\s*daha\s*(?:hi[çc]\s*)?uyanma(?:sam|k\s*istemiyorum)/i,
  /sessizce\s*[çc]ekip\s*gitmek\s*istiyorum/i,
  /can[ıi]ma\s*tak\s*etti/i,
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
  "yaşamanın bir anlamı kalmadı",
  "yaşamanın anlamı kalmadı",
  "yaşamak ağır geliyor",
  "bir daha uyanmasam",
];

const HIGH_DISTRESS_KEYWORDS: ReadonlyArray<string> = [
  "dayanamıyorum",
  "dayanamiyorum",
  "bıktım",
  "biktim",
  "tükendim",
  "tukendim",
  "mahvoldum",
  "çıldıracağım",
  "cildiracagim",
  "boğuluyorum",
  "boguluyorum",
  "nefes alamıyorum",
  "nefes alamiyorum",
  "kaldıramıyorum",
  "kaldiramiyorum",
  "gücüm tükendi",
  "gucum tukendi",
  "gücüm kalmadı",
  "gucum kalmadi",
  "takatim kalmadı",
  "takatim kalmadi",
  "çaresiz kaldım",
  "caresiz kaldim",
  "çıkmazdayım",
  "cikmazdayim",
  "çıkış yolu bulamıyorum",
  "cikis yolu bulamiyorum",
  "her şey üst üste geldi",
  "her sey ust uste geldi",
  "herkes bana sırt çevirdi",
  "herkes sirt cevirdi",
  "yapayalnız kaldım",
  "yapayalniz kaldim",
  "kimsem kalmadı",
  "kimsem kalmadi",
  "ağlamaktan helak oldum",
  "bittim ben",
  "perişan oldum",
  "perisan oldum",
  "içim parçalanıyor",
  "hayatım mahvoldu",
  "depresyondayım",
  "depresyondayim",
  "panik atak",
  "ruhen çöktüm",
  "aklımı yitireceğim",
];

const MODERATE_DISTRESS_KEYWORDS: ReadonlyArray<string> = [
  "çok bunaldım",
  "cok bunaldim",
  "bunaldım",
  "bunaldim",
  "içim daralıyor",
  "icim daraliyor",
  "içim sıkılıyor",
  "icim sikiliyor",
  "huzursuzum",
  "göğsüm daralıyor",
  "gogsum daraliyor",
  "kalbim sıkışıyor",
  "kalbim sikisiyor",
  "yoruldum artık",
  "ne yapacağımı bilmiyorum",
  "ne yapacagimi bilmiyorum",
  "kafam çok karışık",
  "kafam cok karisik",
  "çok kaygılıyım",
  "cok kaygiliyim",
  "korkuyorum",
  "haksızlığa uğradım",
  "haksizliga ugradim",
  "rızık telaşı",
  "rizik korkusu",
  "depresyon",
  "anksiyete",
  "psikolojim",
  "psikolojik",
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

interface WeightedMoodPattern {
  regex: RegExp;
  weight: number;
}

const MOOD_SIGNAL_PATTERNS: Record<
  Exclude<SessionMood, "SAKIN_VE_DENGELI">,
  ReadonlyArray<WeightedMoodPattern>
> = {
  OFKELI_VE_GERGIN: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:öfkeden|sinirden|çok\s*öfkeliyim|çok\s*sinirliyim|çok\s*kızgınım|çok\s*kızdım|çileden\s*çıktım|kan\s*beynime|sabır\s*taşım\s*çatladı|tahammülüm\s*kalmadı|burnumdan\s*soluyorum|nefret\s*ediyorum|patlayaca[ğg]ım|patlamak\s*üzereyim|boğazlayasım|hıncımı|intikam|bağırdım|kalp\s*kırdım|eşyaları\s*kırdım|ağzıma\s*geleni\s*söyledim|hesap\s*soraca[ğg]ım)(?![\p{L}\p{N}])/iu,
      weight: 1.4,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:öfke[\p{L}]*|sinirli[\p{L}]*|sinirlendim|sinirim\s*bozuldu|kızgın[\p{L}]*|kızdım|delirece[ğg]im|delirtti|çıldırttı|kin|haksızlı[ğg]a\s*uğradım|hakkımı\s*yediler|hakkım\s*yendi|göz\s*göre\s*göre|saygısızlık|terbiyesizlik|tahrik\s*etti|kavga\s*ettik|kavga\s*ettim|tartıştık)(?![\p{L}\p{N}])/iu,
      weight: 0.95,
    },
  ],
  HUZUNLU_VE_KIRGIN: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:ağlıyorum|ağladım|gözyaş[\p{L}]*|kalbim\s*kırık|kalbimi\s*(?:çok\s*)?kırdı[\p{L}]*|çok\s*kırgınım|çok\s*üzgünüm|çok\s*üzüldüm|içim\s*acıyor|içim\s*yanıyor|içim\s*parçalanıyor|içim\s*kan\s*ağlıyor|boğazım\s*düğümleniyor|vefat\s*etti|kaybettim|toprağa\s*verdim|yas\s*tutuyorum|boşandım|terk\s*edildim|yapayalnız\s*kaldım|kimsem\s*kalmadı)(?![\p{L}\p{N}])/iu,
      weight: 1.4,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:hüzün[\p{L}]*|üzgün[\p{L}]*|üzüldüm|üzülüyorum|kırgın[\p{L}]*|kırıldım|incindim|incittiler|keder[\p{L}]*|yas\s*sürec[\p{L}]*|hasret|özledim|yalnızım|yalnızlık|depresyon[\p{L}]*|mutsuzum|dışlandım|sırt\s*çevirdi)(?![\p{L}\p{N}])/iu,
      weight: 0.95,
    },
  ],
  KAYGILI_VE_DARALMIS: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:panik\s*atak|anksiyete[\p{L}]*|çok\s*kaygılıyım|çok\s*korkuyorum|nefes\s*alamıyorum|göğsüm\s*daralıyor|kalbim\s*sıkışıyor|içim\s*daralıyor|okb|vesvese[\p{L}]*)(?![\p{L}\p{N}])/iu,
      weight: 1.3,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:kaygı[\p{L}]*|endişe[\p{L}]*|korkuyorum|evham[\p{L}]*|tedirgin[\p{L}]*|huzursuzum|stres[\p{L}]*|daraldım|bunaldım|belirsizlik)(?![\p{L}\p{N}])/iu,
      weight: 0.85,
    },
  ],
  YORGUN_VE_TUKENMIS: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:tükendim|tükenmiş[\p{L}]*|ruhen\s*çöktüm|takatim\s*kalmadı|gücüm\s*kalmadı|gücüm\s*tükendi|burnout)(?![\p{L}\p{N}])/iu,
      weight: 1.3,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:çok\s*yoruldum|yoruldum|yorgunum|bitkinim|halsizim|bıktım|usandım|uyuyamıyorum|uykusuz[\p{L}]*|enerjim\s*kalmadı)(?![\p{L}\p{N}])/iu,
      weight: 0.9,
    },
  ],
  PISMAN_VE_MAHCUP: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:çok\s*pişmanım|vicdan\s*azabı|vicdanım\s*sızlıyor|utanıyorum|yüzüm\s*yok|keşke\s*yapmasaydım|affeder\s*mi)(?![\p{L}\p{N}])/iu,
      weight: 1.3,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:pişman[\p{L}]*|mahcubum|mahcup[\p{L}]*|günah\s*işledim|tövbe|tevbe|hatamı\s*biliyorum|nefsim[\p{L}]*\s*yenik)(?![\p{L}\p{N}])/iu,
      weight: 0.9,
    },
  ],
  KARARLI_VE_GAYRETLI: [
    {
      regex:
        /(?<![\p{L}\p{N}])(?:niyet\s*ettim|karar\s*verdim|namaza\s*başladım|başlamak\s*istiyorum|gayret\s*ediyorum|bırakmaya\s*karar\s*verdim)(?![\p{L}\p{N}])/iu,
      weight: 1.2,
    },
    {
      regex:
        /(?<![\p{L}\p{N}])(?:istikamet|gayret|azim|inşallah\s*başaraca[ğg]ım|sabretmeye\s*kararlıyım)(?![\p{L}\p{N}])/iu,
      weight: 0.8,
    },
  ],
};

function scoreSingleTextMoods(
  rawText: string
): Record<Exclude<SessionMood, "SAKIN_VE_DENGELI">, number> {
  const normalized = (rawText || "").toLocaleLowerCase("tr-TR");
  const scores: Record<Exclude<SessionMood, "SAKIN_VE_DENGELI">, number> = {
    OFKELI_VE_GERGIN: 0,
    HUZUNLU_VE_KIRGIN: 0,
    KAYGILI_VE_DARALMIS: 0,
    YORGUN_VE_TUKENMIS: 0,
    PISMAN_VE_MAHCUP: 0,
    KARARLI_VE_GAYRETLI: 0,
  };

  if (!normalized.trim()) return scores;

  (
    Object.keys(MOOD_SIGNAL_PATTERNS) as Array<
      Exclude<SessionMood, "SAKIN_VE_DENGELI">
    >
  ).forEach((mood) => {
    for (const entry of MOOD_SIGNAL_PATTERNS[mood]) {
      const globalRegex = new RegExp(entry.regex.source, "giu");
      const matches = normalized.match(globalRegex);
      if (matches && matches.length > 0) {
        // İlk eşleşme tam ağırlık, aynı kategorideki ek ifadeler azalan katkı sağlar
        scores[mood] +=
          entry.weight + Math.min(2, matches.length - 1) * (entry.weight * 0.45);
      }
    }
  });

  return scores;
}

/**
 * Veri saklanmasa dahi (stateless / 0ms RAM) yalnızca aktif mesaj ve oturum içi
 * son mesaj geçmişinden kullanıcının anlık ruh halini tespit eder.
 */
export function detectSessionMood(
  userMessage: string,
  sessionHistory?: ReadonlyArray<{ role: string; content: string }>
): SessionMood {
  const trimmed = (userMessage || "").trim();
  if (!trimmed) return "SAKIN_VE_DENGELI";

  const lower = trimmed.toLocaleLowerCase("tr-TR");

  // Açık selamlaşma veya ferahlama/teşekkür kapanışı varsa eski gerginliği taşıma
  const isPureGreetingOrRelief =
    /^(selam|selamün\s*aleyküm|merhaba|iyi\s*günler|günaydın|hayırlı\s*sabahlar|hayırlı\s*akşamlar)(?![\p{L}\p{N}])/iu.test(
      lower
    ) ||
    /(?<![\p{L}\p{N}])(?:ferahladım|rahatladım|sakinleştim|içim\s*ferahladı|çok\s*iyi\s*geldi)(?![\p{L}\p{N}])/iu.test(
      lower
    ) ||
    (trimmed.split(/\s+/).length <= 6 &&
      /(?<![\p{L}\p{N}])(?:teşekkür[\p{L}]*|sağ\s*ol[\p{L}]*|allah\s*razı\s*olsun|eyvallah)(?![\p{L}\p{N}])/iu.test(
        lower
      ));

  const currentScores = scoreSingleTextMoods(trimmed);
  const moodKeys = Object.keys(currentScores) as Array<
    Exclude<SessionMood, "SAKIN_VE_DENGELI">
  >;
  const currentMaxScore = Math.max(...moodKeys.map((k) => currentScores[k]));

  if (isPureGreetingOrRelief && currentMaxScore < 0.9) {
    return "SAKIN_VE_DENGELI";
  }

  // Son 3 kullanıcı mesajını yenilik ağırlığıyla (0.52, 0.32, 0.18) dahil et.
  // Eğer mevcut mesajın kendisinde yeni ve güçlü bir duygu geçişi varsa (currentMaxScore >= 0.9),
  // geçmiş turların ağırlığını sönümle ki oturum içi duygu değişimi (örn. öfke -> hüzün) anında yansısın.
  const recentUserTurns = (sessionHistory || [])
    .filter(
      (item) =>
        item &&
        item.role === "user" &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .slice(-3)
    .reverse();

  const baseDecayWeights = [0.52, 0.32, 0.18];
  const historyDampener = currentMaxScore >= 0.9 ? 0.3 : 1.0;

  const combinedScores: Record<Exclude<SessionMood, "SAKIN_VE_DENGELI">, number> =
    { ...currentScores };

  recentUserTurns.forEach((turn, idx) => {
    const turnWeight = (baseDecayWeights[idx] ?? 0.12) * historyDampener;
    const turnScores = scoreSingleTextMoods(turn.content);
    for (const mood of moodKeys) {
      combinedScores[mood] += turnScores[mood] * turnWeight;
    }
  });

  // En baskın ruh halini seç (eşitlik durumunda mevcut mesajdaki skoru yüksek olan önceliklidir)
  let bestMood: SessionMood = "SAKIN_VE_DENGELI";
  let bestScore = 0;

  for (const mood of moodKeys) {
    const score = combinedScores[mood];
    if (
      score >= 0.45 &&
      (score > bestScore ||
        (Math.abs(score - bestScore) < 0.05 &&
          bestMood !== "SAKIN_VE_DENGELI" &&
          currentScores[mood] > currentScores[bestMood]))
    ) {
      bestScore = score;
      bestMood = mood;
    }
  }

  return bestMood;
}

export async function analyzeWithJev(
  params: JevAnalysisRequest
): Promise<JevAnalysisResult> {
  return runHeuristicFallback(params.userMessage, params.sessionHistory);
}

/**
 * Rule-based System 1 reflex classifier driven by the declarative HEURISTIC_TOPIC_RULES table
 * and stateless in-session mood detection.
 */
export function runHeuristicFallback(
  text: string,
  sessionHistory?: ReadonlyArray<{ role: string; content: string }>
): JevAnalysisResult {
  const lower = text.toLocaleLowerCase("tr-TR");
  const violenceCheck = checkViolenceAndAbuse(text);
  const crisisCheck = checkCrisisAndSuicide(text);
  const sessionMood = detectSessionMood(text, sessionHistory);

  const fatwaMatches = FATWA_KEYWORDS.filter((k) => lower.includes(k));
  const isIlmihalQuery = detectIlmihalWorshipQuery(text);
  const isFatwa = isIlmihalQuery
    ? 0.96
    : fatwaMatches.length >= 2
      ? 0.95
      : fatwaMatches.length === 1
        ? 0.88
        : 0.0;

  const ribaDirectMatches = RIBA_KEYWORDS.filter((k) => lower.includes(k));
  const debtKeywords = [
    "borç",
    "borcum",
    "haciz",
    "icra",
    "kredi kartı",
    "geçim sıkıntısı",
    "alacak",
  ];
  const hasDebtMention = debtKeywords.some((k) => lower.includes(k));
  const isRiba =
    ribaDirectMatches.length > 0 ? 0.9 : hasDebtMention ? 0.45 : 0.0;

  let distressLevel = 4;
  if (
    violenceCheck ||
    crisisCheck ||
    EXTREME_DISTRESS_KEYWORDS.some((k) => lower.includes(k))
  ) {
    distressLevel = 10;
  } else if (HIGH_DISTRESS_KEYWORDS.some((k) => lower.includes(k))) {
    distressLevel = 8;
  } else if (
    sessionMood === "OFKELI_VE_GERGIN" ||
    sessionMood === "HUZUNLU_VE_KIRGIN"
  ) {
    const isIntenseMood =
      /\b(?:patlayaca[ğg]ım|delirece[ğg]im|çileden\s*çıktım|titriyor|kan\s*beynime|içim\s*parçalanıyor|ağlıyorum|kalbim\s*kırık|vefat|kaybettim)\b/i.test(
        lower
      );
    distressLevel = isIntenseMood ? 8 : 7;
  } else if (
    MODERATE_DISTRESS_KEYWORDS.some((k) => lower.includes(k)) ||
    sessionMood === "KAYGILI_VE_DARALMIS" ||
    sessionMood === "YORGUN_VE_TUKENMIS" ||
    sessionMood === "PISMAN_VE_MAHCUP"
  ) {
    distressLevel = 6;
  } else if (
    /^(selam|merhaba|iyi günler|günaydın|hayırlı sabahlar|alooo)/i.test(
      lower.trim()
    ) ||
    lower.includes("teşekkür") ||
    lower.includes("sağ ol") ||
    lower.includes("allah razı olsun")
  ) {
    distressLevel = 2;
  }

  let needsAudio = 0.5;
  if (distressLevel >= 8) {
    needsAudio = 0.95;
  } else if (distressLevel >= 6) {
    needsAudio = 0.85;
  } else if (
    lower.includes("dua") ||
    lower.includes("teselli") ||
    lower.includes("dinle")
  ) {
    needsAudio = 0.8;
  } else if (distressLevel <= 3) {
    needsAudio = 0.2;
  }

  let nafsTrap: NafsTrap = "UMITSIZLIK_KARAMSARLIK";
  let ragCategory: RagCategory = "TEVEKKUL_VE_MURAKABE";
  let recommendedTone: TonePreference = "SEFKATLI_TESKIN";
  let spiritualStage: SpiritualStage =
    distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC";

  // Konuşma başlatma / selamlaşma / kontrol / tanışma
  const isGreeting =
    /^(selam|merhaba|iyi günler|günaydın|hayırlı sabahlar|alooo|alo)/i.test(
      lower.trim()
    ) ||
    /^(benim\s+ad[ıi]m|ad[ıi]m|benim\s+ismim|ismim)\b/i.test(lower.trim()) ||
    (lower.trim().length <= 4 && sessionMood === "SAKIN_VE_DENGELI");

  // Sabırsızlık / sitem / uzun yazı şikayeti
  const isImpatience =
    /(?:ne uzun yazdın|kısa kes|uzun yazma|bıktım okumaktan|çok uzun|özet geç)/i.test(
      lower
    );

  // Şans / kader sorgusu
  const isFateOrLuck =
    /(?:şans diye|şans var mı|sans var mi|kaderimde|tesadüf|kısmet mi)/i.test(
      lower
    );

  // Şüphe / zan / aldatılma
  const isSuspicion =
    /(?:bile bile|arkamdan|şüphelen|güvenmiyorum|aldattı|kandırdı|hain)/i.test(
      lower
    );

  // Varoluşsal boşluk / kimlik arayışı
  const isExistential =
    /(?:ben kimim|kendimi kaybettim|boşluktayım|hayatın anlamı|amacım ne)/i.test(
      lower
    );

  // İş / rızık / gelecek telaşı
  const isWorkStress =
    /(?:iş yerinde|iş hayatı|haksızlığa uğradım|patron|maaş|rızık telaşı|geçim derdi|gelecek kaygısı)/i.test(
      lower
    );

  // Aile / terk edilme / yalnız kalma
  const isAbandonment =
    /(?:herkes bana sırt|sırt çevirdi|terk etti|yalnız bıraktı|kimsem kalmadı)/i.test(
      lower
    );

  // Öfke / nefis aklama ayrımı
  const isSelfJustifyingAnger =
    /(?:suç tamamen onda|bende hiç kabahat yok|beni bu hale o getirdi|tamamen haklıyım)/i.test(
      lower
    );

  if (isGreeting) {
    nafsTrap = "REHAVET_TEMBELLIK";
    ragCategory = "TEVEKKUL_VE_MURAKABE";
    recommendedTone = "SEFKATLI_TESKIN";
    spiritualStage = "ARAYIS_VE_BASLANGIC";
  } else if (isImpatience) {
    nafsTrap = "ACELECI_TALEPLER_VE_ISTIACAL";
    ragCategory = "OFKE_VE_AHLAK";
    recommendedTone = "SAKINLESTIRICI_VE_VAKUR";
    distressLevel = Math.max(distressLevel, 4);
  } else if (sessionMood === "OFKELI_VE_GERGIN" && isRiba <= 0.4) {
    nafsTrap = isSelfJustifyingAnger
      ? "GIZLI_KIBIR_HAKLILIK"
      : "INTIKAM_VE_HASET";
    ragCategory = "OFKE_VE_AHLAK";
    recommendedTone = "SAKINLESTIRICI_VE_VAKUR";
    distressLevel = Math.max(distressLevel, 7);
  } else if (isFateOrLuck) {
    nafsTrap = "KADERE_ITIRAZ_VE_ISYAN";
    ragCategory = "KADER_VE_KAZA_HIKMETI";
    recommendedTone = "HIKMETLI_SUKUT";
    spiritualStage = "ARAYIS_VE_BASLANGIC";
  } else if (isSuspicion) {
    nafsTrap = "SUI_ZAN_VE_TECESSUS";
    ragCategory = "KALP_AMELLERI_VE_IHLAS";
    recommendedTone =
      sessionMood === "HUZUNLU_VE_KIRGIN"
        ? "SEFKATLI_TESKIN"
        : "NET_VE_MUALLIM";
    distressLevel = Math.max(distressLevel, 5);
  } else if (isExistential) {
    nafsTrap = "TUL_I_EMEL_VE_GAYETSIZLIK";
    ragCategory = "TEVEKKUL_VE_MURAKABE";
    recommendedTone = "SEFKATLI_TESKIN";
    distressLevel = Math.max(distressLevel, 5);
  } else if (isAbandonment) {
    nafsTrap = "DUNYALIK_KAYGI";
    ragCategory = "AILE_VE_SILA_I_RAHIM";
    recommendedTone = "SEFKATLI_TESKIN";
    distressLevel = Math.max(distressLevel, 8);
  } else if (isRiba > 0.4 || isWorkStress) {
    nafsTrap = "FAKIRLIK_KORKUSU_VESVESESI";
    ragCategory = "RIZIK_VE_TICARET";
    recommendedTone =
      sessionMood === "OFKELI_VE_GERGIN"
        ? "SAKINLESTIRICI_VE_VAKUR"
        : distressLevel >= 7 || sessionMood === "HUZUNLU_VE_KIRGIN"
          ? "SEFKATLI_TESKIN"
          : "NET_VE_MUALLIM";
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
    } else if (sessionMood === "HUZUNLU_VE_KIRGIN") {
      nafsTrap = "UMITSIZLIK_KARAMSARLIK";
      ragCategory = "TESKIN_VE_TESELLI";
      recommendedTone = "SEFKATLI_TESKIN";
    } else if (sessionMood === "KARARLI_VE_GAYRETLI") {
      nafsTrap = "REHAVET_TEMBELLIK";
      ragCategory = "TEVEKKUL_VE_MURAKABE";
      recommendedTone = "DIRILIS_VE_GAYRET";
      spiritualStage = "ISTIKAMET_VE_INSA";
    }
  }

  // Oturum ruh hali bazlı nihai tonlama güvencesi (Veri saklanmasa dahi ruh haline uyum)
  if (!isGreeting && isFatwa < 0.75) {
    if (sessionMood === "OFKELI_VE_GERGIN") {
      recommendedTone = "SAKINLESTIRICI_VE_VAKUR";
    } else if (
      sessionMood === "HUZUNLU_VE_KIRGIN" ||
      sessionMood === "KAYGILI_VE_DARALMIS" ||
      sessionMood === "YORGUN_VE_TUKENMIS" ||
      sessionMood === "PISMAN_VE_MAHCUP"
    ) {
      recommendedTone = "SEFKATLI_TESKIN";
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
    needs_audio_snippet: needsAudio,
    nafs_trap: violenceCheck ? "INTIKAM_VE_HASET" : nafsTrap,
    rag_category: violenceCheck ? "OFKE_VE_AHLAK" : ragCategory,
    distress_level: distressLevel,
    recommended_tone: recommendedTone,
    session_mood: sessionMood,
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
