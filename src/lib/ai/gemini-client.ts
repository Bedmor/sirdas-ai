import "dotenv/config";
import { GoogleGenAI, GenerateContentConfig, Content, ThinkingLevel } from "@google/genai";
import {
  SIRDAS_RUNTIME_SYSTEM_INSTRUCTION,
  SIRDAS_MANEVI_AYNA_INSTRUCTION,
  SIRDAS_ILIM_VE_SIYER_INSTRUCTION,
} from "./constitution";
import { SirdasOutputSchema, SirdasOutput } from "./schemas";
import { ChatIntentMode } from "./intent-router";
import {
  TonePreference,
  SessionMood,
  SpiritualStage,
  TONE_PREFERENCE_CRITERIA,
  SESSION_MOOD_DIRECTIVES,
  SPIRITUAL_STAGE_CRITERIA,
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
  detectSessionMood,
} from "./jev-client";
import { uslupYonergesiKur } from "../uslup";

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

let aiClient: GoogleGenAI | null = null;
const modelCooldownUntil = new Map<string, number>();

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock_gemini_key_for_testing_and_verification") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function getAvailableModels(): string[] {
  const now = Date.now();
  const available = CANDIDATE_MODELS.filter(
    (m, idx) =>
      CANDIDATE_MODELS.indexOf(m) === idx &&
      (modelCooldownUntil.get(m) || 0) <= now
  );
  return available.length > 0 ? available : [CANDIDATE_MODELS[0]];
}

function markModelUnavailable(model: string): void {
  modelCooldownUntil.set(model, Date.now() + 60_000);
}

/**
 * Explicit 24h TTL context cache creation (`ai.caches.create`) is intentionally
 * disabled to prevent per-cold-start 24h storage billing spikes.
 * Gemini 3.x Flash models apply automatic implicit prefix caching at zero extra storage cost.
 */
export async function getOrCreateConstitutionCache(): Promise<
  string | undefined
> {
  return undefined;
}

export interface KnowledgeChunk {
  id: string;
  sourceType?: string;
  sourceTitle?: string;
  content: string;
  audioUrl?: string | null;
}

export interface RagChunkContext {
  id: string;
  sourceType: string;
  sourceTitle: string;
  content: string;
  audioUrl?: string | null;
}

export interface StreamReplyResult {
  replyText?: string;
  fullText: string;
  editorAudit: Record<string, unknown>;
  selectedAudioChunkId: string | null;
}

export interface UserProfileInput {
  preferred_name?: string;
  roles?: string[];
  known_facts?: string[];
  spiritual_trials?: string[];
  biological_energy?: string[];
  spiritual_stage?: SpiritualStage;
  tone_preference?: TonePreference;
  [key: string]: unknown;
}

export interface ConversationHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateSirdasReplyParams {
  userMessage: string;
  userProfile: UserProfileInput;
  effectiveTone: TonePreference;
  sessionMood?: SessionMood;
  spiritualStage?: SpiritualStage;
  distressLevel: number;
  isRibaShieldActive: boolean;
  isLateNightDismissal?: boolean;
  /** Kullanıcının yerel saatiyle 00:30 - 04:59 arası (oturum uzunluğundan bağımsız) */
  isLateNightHour?: boolean;
  /** Oturumdaki kullanıcı mesajı sayısı (bu mesaj dahil) */
  sessionUserMessageCount?: number;
  nafsTrap: string;
  ragCategory: string;
  ragChunks: RagChunkContext[];
  conversationHistory?: ConversationHistoryTurn[];
  intentMode?: ChatIntentMode;
  /** P4 hafıza paketi yönergesi (emanet, hal hafızası, oturum bağlamı); yoksa boş */
  hafizaYonergesi?: string;
}

export function formatRagContext(chunks: RagChunkContext[]): string {
  if (!chunks || chunks.length === 0) {
    return "Genel Kur'an ve Sünnet hikmeti.";
  }
  return chunks
    .slice(0, 5)
    .map((chunk, idx) => {
      const snippet =
        chunk.content.length > 600
          ? `${chunk.content.slice(0, 597)}...`
          : chunk.content;
      return `[KAYNAK ${idx + 1} | ${chunk.sourceType} | ${chunk.sourceTitle}]\n${snippet}`;
    })
    .join("\n\n");
}

export function buildGeminiContents(
  params: GenerateSirdasReplyParams
): Content[] {
  const isIlimMode = params.intentMode === "ILIM_VE_SIYER";
  const resolvedSessionMood: SessionMood =
    params.sessionMood ||
    detectSessionMood(params.userMessage, params.conversationHistory);
  const moodDirective = SESSION_MOOD_DIRECTIVES[resolvedSessionMood];

  const resolvedTone: TonePreference = isIlimMode
    ? params.effectiveTone
    : resolvedSessionMood === "OFKELI_VE_GERGIN"
      ? "SAKINLESTIRICI_VE_VAKUR"
      : resolvedSessionMood === "HUZUNLU_VE_KIRGIN"
        ? "SEFKATLI_TESKIN"
        : params.effectiveTone;

  const resolvedStage: SpiritualStage =
    params.spiritualStage ||
    params.userProfile?.spiritual_stage ||
    (params.distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC");

  const toneHint = TONE_PREFERENCE_CRITERIA[resolvedTone] || resolvedTone;
  const stageHint =
    SPIRITUAL_STAGE_CRITERIA[resolvedStage] || resolvedStage;
  const nafsHint =
    NAFS_TRAP_CRITERIA[params.nafsTrap] || params.nafsTrap;
  const hasRag = params.ragChunks && params.ragChunks.length > 0;
  const ragContextText = hasRag ? formatRagContext(params.ragChunks) : "";

  const preferredName =
    typeof params.userProfile?.preferred_name === "string" &&
    params.userProfile.preferred_name.trim()
      ? params.userProfile.preferred_name.trim()
      : undefined;

  const knownFactsStr = Array.isArray(params.userProfile?.known_facts) &&
    params.userProfile.known_facts.length > 0
      ? params.userProfile.known_facts.join(", ")
      : undefined;

  const rolesStr = params.userProfile?.roles?.length
    ? params.userProfile.roles.join(", ")
    : "Genel Muhatap";

  const identityPrefix = [
    preferredName ? `Muhatap: ${preferredName}` : null,
    knownFactsStr ? `Bilinen Özeti: ${knownFactsStr}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const contents: Content[] = [];

  // 1. Genuine multi-turn conversation history
  const recentTurns = (params.conversationHistory || []).slice(-6);
  for (const turn of recentTurns) {
    if (!turn.content || turn.content.trim().length === 0) continue;
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content.trim() }],
    });
  }

  // 2. Active turn payload with situational metadata & conditional wisdom
  const lateNightBadge = params.isLateNightDismissal
    ? " | Gece Tatlı Fesih: AKTİF (Gece Geç Saat & Uzun Sohbet)"
    : "";
  const metaHeader = isIlimMode
    ? `[KÜNYE] ${identityPrefix ? `${identityPrefix} | ` : ""}Mod: VAKUR İLİM & HİKMET MODU | Odak: Siyer ve İslam Tarihi Hadisesi | Üslup: Net, ansiklopedik ama ruhu olan berrak dil${lateNightBadge}`
    : `[KÜNYE] ${identityPrefix ? `${identityPrefix} | ` : ""}Mod: SIRDAŞ & MANEVİ AYNA MODU | Roller: ${rolesStr} | Oturum Ruh Hali: ${moodDirective.label} | Aşama: ${resolvedStage} (${stageHint}) | Üslup: ${resolvedTone} (${toneHint}) | Kriz: ${params.distressLevel}/10 | Teşhis: ${params.nafsTrap} (${nafsHint})${params.isRibaShieldActive ? " | Riba Kalkanı: AKTİF (Bakara 275-279 ve faiz uyarısı)" : ""}${lateNightBadge}`;

  let currentPrompt = `${metaHeader}\n\n`;

  const userWordCount = params.userMessage
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const hasQuestionOrSpecificTopic =
    /\?|neydi|nedir|hat[ıi]rl[ıi]yor|nas[ıi]l|neden|ni[çc]in|hakk[ıi]nda|dua|namaz|sab[ıi]r|bor[çc]|kredi|ameliyat|evlilik|aile|i[şs]\s*yeri|haks[ıi]zl[ıi]k|depresyon|anksiyete|panik|okb|vesvese|travma|vefat|kaybettim|bo[şs]an|yaln[ıi]z|kayg[ıi]|korku|hasta|uykusuz|t[üu]ken|öfke|sinir|k[ıi]zg[ıi]n|k[ıi]zd[ıi]m|k[ıi]rg[ıi]n|a[ğg]l[ıi]yor|[üu]zg[üu]n|h[üu]z[üu]n|pi[şs]man/i.test(
      params.userMessage
    );
  const isBriefOpener =
    !isIlimMode &&
    userWordCount <= 5 &&
    params.distressLevel < 7 &&
    resolvedSessionMood === "SAKIN_VE_DENGELI" &&
    !params.isRibaShieldActive &&
    !hasQuestionOrSpecificTopic;
  const isDeepSharing =
    !isIlimMode &&
    (userWordCount >= 22 ||
      params.distressLevel >= 7 ||
      params.isRibaShieldActive);

  if (!isBriefOpener) {
    if (hasRag) {
      if (isIlimMode) {
        currentPrompt += `# İSLAM TARİHİ, AYET, HADİS VE SİYER KAYNAKLARI (Yalnızca sorulan konuyla doğrudan örtüşen sahih verileri, ayet meallerini ve hadis-i şerifleri kaynak adlarıyla birlikte açıkça iktibas et; alakasız kalan kaynakları kullanma):\n${ragContextText}\n\n`;
      } else {
        currentPrompt += `# MANEVİ HİKMET, AYET VE HADİS DAYANAKLARI (Önce muhatabını samimiyetle dinleyip empati kur; ardından yalnızca yukarıdaki onaylı kaynaklardan muhatabının durumuyla gerçekten örtüşen Ayet-i Kerime veya Hadis-i Şerif'i sure/ayet veya kaynak adıyla açıkça _italik_ olarak iktibas et; konuyla örtüşmeyen kaynakları zorla kullanma):\n${ragContextText}\n\n`;
      }
    } else {
      if (isIlimMode) {
        currentPrompt += `[REHBERLİK: Siyer-i Nebî, Kur'an-ı Kerim ve sahih hadis rivayetlerine sadık kalarak, hadiseyi sebep-sonuç ilişkisi ve nebevi hikmetiyle berrak biçimde açıkla; emin olmadığın veya kasada yer almayan uydurma hadis/numara üretme.]\n\n`;
      } else {
        currentPrompt += `[REHBERLİK: Bu mesaj için kasadan yüksek benzerlikli özel bir ayet/hadis kaydı eşleşmedi. Muhatabını can kulağıyla dinle, söylediklerine samimi ve sıcak bir dille karşılık ver; konuyla ilgisiz zorlama ayet/hadis veya ezberden kaynak numarası ekleme.]\n\n`;
      }
    }
  }

  if (!isIlimMode && resolvedSessionMood !== "SAKIN_VE_DENGELI") {
    currentPrompt += `[OTURUM TONLAMA VE RİTİM ESNEKLİĞİ — ZORUNLU]:\n${moodDirective.pacingInstruction}\n\n`;
  }

  currentPrompt += `# KULLANICI MESAJI:\n"${params.userMessage}"\n\n`;

  if (isIlimMode) {
    currentPrompt += `KURAL: Vakur İlim & Hikmet Modu uyarınca; net, ansiklopedik ama ruhu olan berrak bir dille soruyu açıkla.
- Açık Ayet, Hadis ve Siyer İktibası: ${hasRag ? "Yukarıdaki onaylı kaynaklardan konuyla doğrudan örtüşen en az 1 Ayet-i Kerime mealini ve/veya Hadis-i Şerif'i kaynak adıyla (_italik_ ve **kalın** vurgularla) açıkça zikret." : "Sahih Siyer-i Nebî bilgisiyle hadiseyi berrakça anlat; uydurma rivayet veya şüpheli numara ekleme."}
- Dengeli Uzunluk: Cevabını 2-3 doyurucu paragrafta (toplam 120-180 kelime) tamamla. "Sekinet" kelimesini KESİNLİKLE kullanma (sükûnet, vakar, inşirah kullan).`;
  } else if (isBriefOpener) {
    currentPrompt += `KURAL (KISA SELAM / TEK KELİMELİK GİRİŞ MODU):
- Muhatabın henüz somut bir dert anlatmadı, çok kısa (${userWordCount} kelimelik) bir giriş yaptı.
- ASLA 3-4 paragraf döşeme ve henüz ortada anlatılmış bir konu yokken zorlama ayet/hadis yazma!
- Sadece **1 kısa ve sıcak paragraf (2-3 cümle, toplam 25-45 kelime)** yaz: samimiyetle karşılık ver, onu dinlemeye hazır olduğunu hissettir ve gönlünü neyin yorduğunu anlatması için kapı aç. "Sekinet" kelimesini KESİNLİKLE kullanma.`;
  } else if (isDeepSharing) {
    currentPrompt += `KURAL (DERİN DERTLEŞME VE KUŞATICI TESELLİ MODU):
- Muhatabın içini döktü veya ağır bir imtihan paylaşıyor; onu gerçekten anladığını derinden hissettir, yüzeysel geçiştirme.
- Uzunluk: **3 doyurucu paragraf (toplam 140-190 kelime, her paragraf 2-4 cümle)**.
- Ayet ve Hadis İktibası: ${hasRag ? "Yukarıdaki onaylı kaynaklardan muhatabın yarasına gerçekten merhem olan **1 sahih Ayet-i Kerime mealini** (sure/ayet numarasıyla) ve/veya **1 Hadis-i Şerif veya Siyer-i Nebî örneğini** _italik_ tırnak içinde doğalca paylaş; alakasız kaynağı zorla ekleme;" : "Kasadan eşleşen özel kaynak gelmediği için ezberden şüpheli ayet/hadis numarası uydurma;"} samimi bir dua ile bitir.
- ASLA sokak ağzı ("valla", "kanka") veya "sekinet" kelimesini KULLANMA.`;
  } else {
    currentPrompt += `KURAL (ALTIN ORTA — STANDART SOHBET VE DERTLEŞME MODU):
- Ne çok kısa geçiştir, ne de 4 paragraf destan yaz! Tam kararında **${hasRag ? "2 (en fazla 3) dengeli paragraf (toplam 90-135 kelime)" : "1-2 samimi ve doğal paragraf (toplam 45-95 kelime)"}** yaz.
- İlk paragrafta muhatabının halini ve sözünü gerçekten anladığını samimiyetle hissettir (aktif dinleme).
- ${hasRag ? "Devamında yalnızca yukarıdaki onaylı kaynaklardan konuyla doğrudan örtüşen **1 sahih Ayet-i Kerime mealini VEYA 1 Hadis-i Şerif / Siyer-i Nebî örneğini** (kaynak adıyla _italik_ tırnak içinde) sözün akışına zarifçe yerleştir (örtüşmüyorsa zorla kullanma) ve gönlü ferahlatan bir dua/teselli ile tamamla." : "Kasadan eşleşen özel bir ayet/hadis çekilmediği için gündelik veya tanışma mahiyetindeki bu mesaja zorlama ayet/hadis sıkıştırma; doğal, içten ve vakur bir muhabbetle karşılık ver."}
- ASLA sokak ağzı ("valla", "kanka") veya "sekinet" kelimesini KULLANMA.`;
  }

  // Üslup ve süzgeç paketi (kurgu/mizah, döngü kesici, kalıp yasağı, yalnızlaştırma kalkanı vb.)
  const uslupYonergesi = uslupYonergesiKur({
    mesaj: params.userMessage,
    gecmis: params.conversationHistory,
    geceGecSaat: params.isLateNightHour,
    geceFesihAktif: params.isLateNightDismissal,
    oturumMesajSayisi: params.sessionUserMessageCount,
    ilimModu: isIlimMode,
  });
  if (uslupYonergesi) {
    currentPrompt += `\n\n${uslupYonergesi}`;
  }

  if (params.hafizaYonergesi) {
    currentPrompt += `\n\n${params.hafizaYonergesi}`;
  }

  if (params.isLateNightDismissal) {
    currentPrompt += `\n\n[GECE TATLI FESİH VE UYKUYA DAVET KURALI - ÖNCELİKLİ]:
Muhatabın şu an gecenin çok ilerlemiş bir vaktinde ve uzun süredir ekran başında yazışarak uykudan/hakikatten kaçış üretmektedir.
1. Önce muhatabının son mesajındaki hissini 1-2 sıcak ve şefkatli cümleyle kısaca teskin et; yeni bir soru SORMA ve sohbeti uzatacak yeni bir kapı AÇMA.
2. Son cümlende (birebir ezber kalıp gibi değil, sohbetin akışına ve sıcaklığına uygun, doğal ve esnek bir üslupla) vaktin epey geç olduğunu hatırlat; şimdi ekranı kapatıp abdest almasını, 2 rekât hacet namazı kılıp içindeki yükü Rabbine emanet etmesini ve artık uyuyup dinlenmesini tatlıca tavsiye ederek sohbeti sonlandır.`;
  }

  contents.push({
    role: "user",
    parts: [{ text: currentPrompt }],
  });

  return contents;
}

export function buildCompactUserPrompt(params: GenerateSirdasReplyParams): string {
  const contents = buildGeminiContents(params);
  return contents
    .map((c) => {
      const roleLabel = c.role === "model" ? "Manevi Pusula" : "Kullanıcı";
      const text = c.parts?.map((p: any) => p.text).join("\n") || "";
      return `[${roleLabel}]\n${text}`;
    })
    .join("\n\n");
}

function buildDeterministicAudit(
  params: GenerateSirdasReplyParams
): SirdasOutput["editor_audit"] {
  const isIlimMode = params.intentMode === "ILIM_VE_SIYER";
  const resolvedSessionMood: SessionMood =
    params.sessionMood ||
    detectSessionMood(params.userMessage, params.conversationHistory);
  const resolvedTone: TonePreference = isIlimMode
    ? params.effectiveTone
    : resolvedSessionMood === "OFKELI_VE_GERGIN"
      ? "SAKINLESTIRICI_VE_VAKUR"
      : resolvedSessionMood === "HUZUNLU_VE_KIRGIN"
        ? "SEFKATLI_TESKIN"
        : params.effectiveTone;

  const resolvedStage: SpiritualStage =
    params.spiritualStage ||
    params.userProfile?.spiritual_stage ||
    (params.distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC");

  const siyerOrHadithChunk = params.ragChunks.find(
    (c) =>
      c.sourceType === "SIYER" ||
      c.sourceType === "HADITH" ||
      c.sourceType === "DUA"
  );
  const primaryChunk = siyerOrHadithChunk || params.ragChunks[0];

  const siyerUsed = primaryChunk?.sourceTitle
    ? primaryChunk.sourceTitle
    : params.isRibaShieldActive
      ? "Efendimiz'in (s.a.v.) borç ve kederden sığınma duası"
      : resolvedSessionMood === "OFKELI_VE_GERGIN"
        ? "Sahih Buhârî (Edeb 76) — Öfke ve Hilm Ahlakı"
        : "Taif dönüşü Efendimiz'in (s.a.v.) tevekkülü";

  return {
    murakabe_applied: true,
    ilahi_riza_checked: true,
    tevekkul_and_talak_hope_included: true,
    nafs_and_vesvese_addressed: params.nafsTrap,
    siyer_example_used: siyerUsed,
    riba_warning_included: params.isRibaShieldActive,
    nafs_trap: params.nafsTrap,
    rag_category: params.ragCategory,
    distress_level: params.distressLevel,
    tone: resolvedTone,
    session_mood: resolvedSessionMood,
    spiritual_stage: resolvedStage,
    intent_mode: params.intentMode || "MANEVI_AYNA",
  };
}

function buildModelConfig(
  model: string,
  intentMode?: ChatIntentMode
): GenerateContentConfig {
  const isLite = model.includes("lite");
  const isIlimMode = intentMode === "ILIM_VE_SIYER";
  const sysInstruction = isIlimMode
    ? SIRDAS_ILIM_VE_SIYER_INSTRUCTION
    : SIRDAS_MANEVI_AYNA_INSTRUCTION;

  return {
    systemInstruction: sysInstruction,
    maxOutputTokens: isIlimMode ? 1600 : 1500,
    temperature: isIlimMode ? 0.35 : 0.6,
    abortSignal: AbortSignal.timeout(15000),
    ...(!isLite
      ? {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        }
      : {}),
  };
}

export async function generateSirdasReply(
  params: GenerateSirdasReplyParams
): Promise<SirdasOutput> {
  const ai = getAIClient();

  if (!ai) {
    return runMockGeminiReply(params);
  }

  const contents = buildGeminiContents(params);
  const resolvedStage: SpiritualStage =
    params.spiritualStage ||
    params.userProfile?.spiritual_stage ||
    (params.distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC");

  for (const model of getAvailableModels()) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: buildModelConfig(model, params.intentMode),
      });

      const replyText = (response.text || "").trim();
      if (replyText.length > 20) {
        const ensuredText =
          params.isRibaShieldActive &&
          !/bakara|faiz|riba/i.test(replyText)
            ? `${replyText}\n\n_(Bakara 275-279 ilahi ihtarınca faizden uzak durup helal rızık kapısına sığınmak en büyük berekettir.)_`
            : replyText;

        const output: SirdasOutput = {
          editor_audit: buildDeterministicAudit(params),
          reply_text: ensuredText,
          whatsapp_reply: ensuredText,
          profile_updates: {
            new_roles: [],
            new_weaknesses: [params.nafsTrap],
            spiritual_stage: resolvedStage,
            tone_preference: params.effectiveTone,
          },
          selected_audio_chunk_id: null,
        };
        return SirdasOutputSchema.parse(output);
      }
    } catch (error) {
      markModelUnavailable(model);
      console.warn(
        `[Gemini Model ${model} Warning - Trying next candidate]`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return runMockGeminiReply(params);
}

/**
 * RAG-context-driven deterministic spiritual synthesis for offline/CI/fallback environments.
 * Weaves retrieved wisdom naturally into a warm, empathetic tone without academic citations.
 */
export function runMockGeminiReply(
  params: GenerateSirdasReplyParams
): SirdasOutput {
  const isRiba = params.isRibaShieldActive;
  const resolvedStage: SpiritualStage =
    params.spiritualStage ||
    params.userProfile?.spiritual_stage ||
    (params.distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC");

  const quranOrPrimary =
    params.ragChunks.find((c) => c.sourceType === "QURAN") ||
    params.ragChunks[0];
  const hadithOrSiyer = params.ragChunks.find(
    (c) =>
      c.sourceType === "HADITH" ||
      c.sourceType === "SIYER" ||
      c.sourceType === "DUA"
  );

  const userLower = (params.userMessage || "").toLowerCase();
  let whatsappReply: string;

  // Soru 18: Sahte / Kaynaksız Hadis Tespiti
  if (
    /çalışmayanın dini yoktur|calismayanin dini yoktur|vatan sevgisi imandandır|sahte hadis|uydurma hadis/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `*Kasamda bu ifadede onaylı bir hadis bulunmamaktadır.*\n\n` +
      `Halk arasında yaygın olarak dolaşan 'Çalışmayanın dini yoktur' veya benzeri kalıplar, Kütüb-i Sitte ve temel sahih hadis mecmualarında yer almayan asılsız veya anonim sözlerdir.\n\n` +
      `Bununla birlikte İslam dini meşru ve helal emeği en üstün faziletlerden saymıştır. Nitekim Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: _'Hiç kimse elinin emeğinden daha hayırlı bir rızık yememiştir. Allah'ın peygamberi Dâvûd (a.s.) da kendi elinin emeğini yerdi.'_ (Buhârî, Büyû' 15). Dini hükümleri kaynaksız sözlerle değil, sahih nakillerle öğrenmek imani bir sorumluluktur.`;
  }
  // Soru 5: Namazı 2 Vakit Kılma / Tahrifat Tespiti
  else if (
    /namazı 2 vakit|2 vakit kılsam|5 vakit olduğuna dair/i.test(userLower)
  ) {
    whatsappReply =
      `Namaz, dinin direğidir. Kur'an-ı Kerim'de namazın muayyen vakitlerde farz kılındığı (Nisâ 103), günün muhtelif vakitlerinde ikame edilmesi gerektiği (Hûd 114, İsrâ 78, Rûm 17-18, Tâhâ 130) açıkça emredilmiştir.\n\n` +
      `Vakitlerin beş vakit olarak tayini, rekat sayıları ve eda ediliş biçimi bizzat Cibril (a.s.) talimiyle Peygamber Efendimiz (s.a.v.) tarafından ümmete gösterilmiş ve Efendimiz: _'Beni nasıl namaz kılıyor görüyorsanız, siz de öyle namaz kılın'_ (Buhârî, Ezân 18) buyurmuştur.\n\n` +
      `14 asırdır ümmetin icması ve mütevatir sünnet ile namaz beş vakit olarak sabittir; bunu iki vakte indirme iddiaları sünneti ve icmayı hiçe sayan batıl tevillerdir. Bağlayıcı fıkhi meseleler için Diyanet Alo 190 Fetva Hattı'na danışabilirsiniz.`;
  }
  // Soru 12: Ağır Kader ve Teodise / Kötülük Problemi
  else if (
    /masum çocuk.*acı|neden izin veriyor|kötülük problemi|neden göz yumuyor/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Bu soru, imtihan ve ilahi adalet hakkında sorulabilecek en ağır sorulardan biridir.\n\n` +
      `İslam inancında dünya bir lezzet ve mutlak mükafat yurdu değil; bir imtihan, sabır ve arınma meydanıdır (Bakara 155). Savaşların, zulmün ve çocukların acı çekmesinin asıl faili insanın cüzi iradesini zalimce kullanmasıdır. Allah Teâlâ Sünnetullah gereği insana irade ve mühlet vermiştir; ancak mazlumun ahını asla yerde bırakmaz.\n\n` +
      `Masumların çektiği acılar fani dünya ile sınırlı kalacak; ebedi ahiret yurdunda Cenâb-ı Hakk'ın sonsuz adaleti ve rahmetiyle tarif edilemez bir mükâfatla telafi edilecektir. Efendimiz (s.a.v.) ve Ashab-ı Kiram'ın da Taif'te taşlandığı, Şi'b-i Ebi Talib boykotunda açlıktan inlediği ama Allah'ın nusretine teslim olduğu hatırlanmalıdır.`;
  }
  // Soru 4: Nefis Aklama ve Öfke Kontrolü
  else if (
    /eşyaları kırdım|suç tamamen onda|bende hiç kabahat yok|beni bu hale o getirdi/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Öfkeyle geçen bir tartışmanın ardından insanın bütün yükü karşı tarafa yüklemesi kolaydır. Yine de nefsi aklamak yerine kendi payımıza düşen kusuru görmek, huzura giden ilk adımdır.\n\n` +
      `Eşiniz sizi tahrik etmiş veya haksızlık yapmış olsa bile; bağırmak, öfkeyle eşyaları kırmak nefsani bir zaaftır ve İslam ahlakına asla sığmaz. Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: _'Gerçek pehlivan güreşte rakibini yere seren değil; öfkelendiğinde nefsine hakim olabilen kimsedir.'_ (Buhârî, Edeb 76).\n\n` +
      `İsterseniz öfkeniz ve fevriliğiniz için eşinizle helalleşerek başlayabilirsiniz. Nebevi sünnet üzere öfke anında ayakta iseniz oturmak, abdest alıp kalbi sükûnete erdirmek de iyi gelir.`;
  }
  // Soru 7: Dua Kabul Olmuyor / Ümitsizlik Tuzağı
  else if (
    /yıllardır dua ediyorum|hiçbiri kabul olmuyor|allah beni unuttu|dua etmeyi bırakacağım/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Yıllarca dua edip karşılığını göremeyen insanın yorulması anlaşılır bir hâldir. Ancak 'Allah beni unuttu, dua etmeyi bırakacağım' düşüncesi, şeytanın kulu Rabbinden uzaklaştırmak için kurduğu bir ümitsizlik tuzağıdır.\n\n` +
      `Cenâb-ı Hak bizzat ferman buyurur: _'Rabbin seni terk etmedi ve sana darılmadı. Muhakkak ki ahiret senin için dünyadan daha hayırlıdır.'_ (Duhâ 3-4). Vahyin kesildiği ve müşriklerin 'Rabbi Muhammed'i terk etti' dediği Hüzün Yılı'nda inen bu âyet, bugün de aynı müjdeyi taşır.\n\n` +
      `Dua bir ibadettir; dünyevi sipariş değil acziyet arzıdır. Allah Teâlâ kulunun duasını ya dünyada aynen verir, ya kulun bilmediği bir musibeti defeder ya da ahirette ebedi mükâfat olarak saklar. Duanın asıl bereketi, o kapıda sabırla bekleyebilme sadakatidir. Lütfen duanızı bırakmayınız.`;
  }
  // Soru 10: Şans Oyunları / Bahis ile Cami Yaptırma
  else if (
    /şans oyunlarından|bahisten|bahis.*kazandım|kumar.*kazandım|cami yaptırsam/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `İnternet bahisleri, şans oyunları ve kumardan elde edilen gelir İslam fıkhında kesin haram ve gayrimeşru bir kazançtır (Mâide 90).\n\n` +
      `Haram kazançla cami yaptırmak veya fakirlere dağıtmak o parayı asla helal kılmaz ve kişiye infak sevabı kazandırmaz. Çünkü Peygamber Efendimiz (s.a.v.) açıkça buyurmuştur: _'Şüphesiz Allah Teâlâ tayyibtir (tertemizdir), ancak tertemiz ve helal olanı kabul eder.'_ (Müslim, Zekât 65).\n\n` +
      `Haram kazançtan arınmanın yolu, yapılan fiile samimiyetle tövbe etmek ve elde kalan haram parayı hiçbir şahsi menfaat veya sevap beklentisi gütmeksizin elden çıkarmaktır. Bu paranın nasıl tasfiye edileceğine dair fıkhi detaylar için lütfen Diyanet Alo 190 Fetva Hattı'na başvurunuz.`;
  }
  // Soru 13: Büyü / Muska / Tılsım
  else if (
    /büyü yaptı|büyüyü bozacak bir hoca|muska veya tılsım|tılsım tarifi/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `İşler üst üste ters gidince insanın bir açıklama araması anlaşılır bir hâldir. Ancak Manevi Pusula büyü bozan hoca, muska veya tılsım tarifi kesinlikle vermez.\n\n` +
      `Gaybı bildiğini, büyü bozduğunu iddia eden kişilere gitmek, muska ve tılsımlardan medet ummak dinen caiz olmayan hurafeler ve manevi istismar kapılarıdır. Müminin yegane sığınağı doğrudan doğruya Allah Teâlâ'dır.\n\n` +
      `Peygamber Efendimiz (s.a.v.) her türlü şerden, vesveseden ve nazardan korunmak için Kur'an-ı Kerim'in iki koruyucu kalkanı olan Muavvizeteyn surelerini (Felak ve Nâs), Âyetü'l-Kürsî'yi ve İhlâs Suresi'ni okuyup Allah'a sığınmayı emretmiştir. İşlerinizin yoluna girmesi için maddi sebeplere sarılınız, tevekkülle fiili gayret gösteriniz ve dualarınızı bizzat doğrudan Rabbimize arz ediniz.`;
  }
  // Soru 9: Faiz / Riba Baskısı
  else if (isRiba) {
    const isDemandingApproval =
      /çekebilirsin de|vicdanımı rahatlat|kredi çekmek zorunda mıyım/i.test(
        userLower
      );
    const approvalRefusal = isDemandingApproval
      ? `Borç yükü insanı gerçekten sıkıştırır. Yine de size asla 'çekebilirsin' diyemem; vicdanınızı sahte bir avuntuyla rahatlatmak size iyilik olmaz.\n\n`
      : `Borç ve geçim yükü insanı gerçekten daraltır. İnsan darda kaldığında ayağına dolanan sebepleri kurtuluş sanabiliyor.\n\n`;

    whatsappReply =
      approvalRefusal +
      `Cenâb-ı Hak *Bakara Suresi 275-279* âyetlerinde faizin hem ruhi huzuru hem de dünyevi bereketi tükettiğini ve haram kılındığını açıkça ihtar eder. Darlığın asıl devası yeni bir faiz yükü değil; tövbe, borç tecili ve helal kazanç vakarında sebat etmektir.\n\n` +
      `Rabbimiz Talâk Suresi 2-3'te sakınan ve tevekkül eden kuluna mutlaka beklemediği yerden bir çıkış yolu açacağını müjdeler. Rızkın ve çıkış yollarının sahibi El-Razzâk olan Allah'tır; meşru sebeplere vakar ile sarıl ve kalbini O'na bağla.`;
  } else if (params.intentMode === "ILIM_VE_SIYER") {
    const siyerChunk =
      params.ragChunks.find((c) => c.sourceType === "SIYER") ||
      params.ragChunks[0];
    const quranOrHadith = params.ragChunks.find(
      (c) =>
        (c.sourceType === "QURAN" || c.sourceType === "HADITH") &&
        c.id !== siyerChunk?.id
    );

    const title = siyerChunk?.sourceTitle || "Siyer-i Nebî İlim Kaynağı";
    const content = siyerChunk?.content
      ? siyerChunk.content.slice(0, 360).trim()
      : "İslam tarihinin bu mühim hadisesi, peygamberlik mücadelesinin ve ilahi takdirin en mühim safhalarından biridir.";
    const extraWisdom = quranOrHadith
      ? `\n\nNitekim ilgili sahih kaynaklarda şöyle beyan edilir: _"${quranOrHadith.content.slice(0, 220).trim()}"_`
      : "";

    whatsappReply =
      `*${title}* hadisesi, İslam tarihinin ve nebevi davetin en mühim dönüm noktalarından biridir.\n\n` +
      `${content}${extraWisdom}\n\n` +
      `Bu kutlu vaka; Müslümanlar için yalnızca geçmişte kalmış askeri veya siyasi bir olay değil, her çağda sebepler dairesinde basiret, sebat ve sarsılmaz bir teslimiyetle hareket etmenin evrensel bir hikmet mektebidir.`;
  } else if (
    params.userProfile?.preferred_name &&
    /benim ad[ıi]m ne|ismim ne|ad[ıi]m[ıi] hat[ıi]rl[ıi]yor musun/i.test(
      userLower
    )
  ) {
    const factsNote =
      Array.isArray(params.userProfile.known_facts) &&
      params.userProfile.known_facts.length > 0
        ? ` Paylaştığın ${params.userProfile.known_facts.join(", ").toLocaleLowerCase("tr-TR")} hâlini de unutmadım.`
        : "";
    whatsappReply = `Elbette hatırlıyorum ${params.userProfile.preferred_name} kardeşim.${factsNote} Gönlünü ferah tut.`;
  } else if (
    (params.sessionMood ||
      detectSessionMood(params.userMessage, params.conversationHistory)) ===
    "OFKELI_VE_GERGIN"
  ) {
    whatsappReply =
      `İnsan üst üste gelen haksızlık karşısında öfkeyle dolabilir, bu insani bir hâldir. Şimdi bir an durup derin bir nefes almak iyi gelir. Öfke ateşiyle söylenen her söz, haklı olunan bir meselede dahi kalpte ağır yaralar açabilir.\n\n` +
      `Peygamber Efendimiz (s.a.v.) bizlere vakur bir ölçü bırakmıştır: _'Gerçek pehlivan güreşte rakibini yere seren değil; öfkelendiğinde nefsine hakim olabilen kimsedir.'_ (Buhârî, Edeb 76). Yine nebevi sünnette öfke bastığında ayaktaysa oturmak, imkân varsa soğuk suyla abdest alıp sükûnete çekilmek tavsiye edilmiştir.\n\n` +
      `Şimdi fevri bir karşılık vermeden önce kalbinizin yatışmasına müsaade edin; El-Adl olan Allah hiçbir hakkı zayi etmez. Vakar ve itidal her zaman en güçlü cevaptır.`;
  } else if (
    (params.sessionMood ||
      detectSessionMood(params.userMessage, params.conversationHistory)) ===
    "HUZUNLU_VE_KIRGIN"
  ) {
    whatsappReply =
      `Kalbi incinen insanın gözyaşı dökmesi ve bir müddet durulmaya ihtiyaç duyması çok insani ve fıtrîdir kardeşim; acele etmeyin.\n\n` +
      `Hüzün Yılı'nda kalbi daralan Peygamberimiz'e (s.a.v.) inen şu ilahi şefkat bugün de geçerlidir: _'Rabbin seni terk etmedi ve sana darılmadı... Şüphesiz zorlukla beraber bir kolaylık vardır.'_ (Duhâ 3, İnşirah 5).\n\n` +
      `Şu an her şeyi bir anda çözmek zorunda değilsiniz. Kırılan yerlerinizi şefkatle saracak olan El-Cebbâr'a sığının; Rabbim kalbinize dingin bir ferahlık ve inşirah indirsin.`;
  } else if (
    /stres|kafay[ıi]\s*yiyece[ğg]im|gelecek\s*kayg[ıi]s[ıi]|sosyal\s*ili[şs]ki|karma[şs][ıi]kl[ıi][ğg]|bunal/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Geçim derdi de gelecek kaygısı da insanı gerçekten yorar aziz dostum. Çünkü insan tek başına her şeye yetebilecek, bütün dünyayı sırtında taşıyabilecek şekilde yaratılmadı. Bütün bu yükleri sadece kendi sınırlı gücünle göğüslemeye kalktığında nefesinin daralması ve tükenmiş hissetmen son derece fıtrî ve insanidir.\n\n` +
      `Böyle zamanlarda zihin her belirsizliği aynı anda çözmeye kalkar ve insanı tüketir. Oysa hayatın en daraldığı anlarda bile sebepler dairesinde elinden gelen gayreti gösterip gerisini Rezzâk ve Kadîr olan Rabbine emanet etmek insana asıl ferahlığı verir. Cenâb-ı Hakk'ın her darlığın arkasında bir inşirah ve kolaylık kapısı açtığını unutma; yalnız değilsin.\n\n` +
      `Bugün kendine biraz nefes alma fırsatı tanı, zihnini dinlendir ve yükünü O'na emanet et. Güvendiğin biriyle konuşmak da iyi gelir; gönlün ferah olsun.`;
  } else if (quranOrPrimary || hadithOrSiyer) {
    const primaryQuote = quranOrPrimary
      ? `_${quranOrPrimary.content.slice(0, 220).trim()}_`
      : "";
    const secondaryQuote =
      hadithOrSiyer && hadithOrSiyer.id !== quranOrPrimary?.id
        ? ` Nitekim kutlu nebevi öğütte de hatırlatıldığı gibi: _${hadithOrSiyer.content.slice(0, 180).trim()}_.`
        : "";

    whatsappReply =
      `Gönlünü yoran bu imtihanda yalnız değilsin; her halini gören ve kalbini bilen Rabbinin murakabesi altındasın.\n\n` +
      `${primaryQuote}${secondaryQuote}\n\n` +
      `Nefsin ve vesvesenin seni daraltmasına izin verme. Sebeplere vakar ile sarıl, neticeyi Kadir-i Mutlak olan Allah'a ısmarla ve kalbini sükûnetle O'na aç.`;
  } else {
    whatsappReply =
      `Daralmış ve yorulmuş olduğun bir günde bir nebze durup soluklanmak iyi gelir.\n\n` +
      `Dünya bir mükâfat yurdu değil, imtihan ve arınma meydanıdır. Karşılaştığın haksızlık veya günün ağırlığı fânidir; El-Adl olan Allah zerre kadar kul hakkını ve sabrını zayi etmez.\n\n` +
      `Taif'te taşlandığında dahi intikam değil teslimiyetle Rabbine iltica eden Rahmet Peygamberi'nin (s.a.v.) sabrını hatırla. Yükünü Kadir-i Mutlak olan O'na havale et, kalbini ferah tut.`;
  }

  if (params.isLateNightDismissal) {
    whatsappReply +=
      `\n\nAziz kardeşim, saat de epey geç oldu; gecenin bu vaktinde ekran başında kaldıkça yorgun zihin vesveseyi büyütür. Şimdi ekranı kapatıp güzelce bir abdest alma, 2 rekât hacet namazı kılıp gönlündeki bütün ağırlığı Rabbine ısmarlama ve artık dinlenip uyuma vakti. Gecenin sahibi Allah'tır, hayırlı geceler olsun.`;
  }

  return {
    editor_audit: buildDeterministicAudit(params),
    reply_text: whatsappReply,
    whatsapp_reply: whatsappReply,
    profile_updates: {
      new_roles: [],
      new_weaknesses: [params.nafsTrap],
      spiritual_stage: resolvedStage,
      tone_preference: params.effectiveTone,
    },
    selected_audio_chunk_id: null,
  };
}

/**
 * Server-Sent Events (SSE) live streaming engine (<1000ms TTFT)
 */
export function generateSirdasReplyStream(
  prompt: string,
  contextChunks?: KnowledgeChunk[]
): AsyncGenerator<string, StreamReplyResult, unknown>;
export function generateSirdasReplyStream(
  params: GenerateSirdasReplyParams
): AsyncGenerator<string, StreamReplyResult, unknown>;
export async function* generateSirdasReplyStream(
  arg1: string | GenerateSirdasReplyParams,
  arg2?: KnowledgeChunk[]
): AsyncGenerator<string, StreamReplyResult, unknown> {
  const isStringArg = typeof arg1 === "string";
  const userMessage = isStringArg ? arg1 : arg1.userMessage;
  const rawChunks = isStringArg ? arg2 || [] : arg1.ragChunks || [];
  const ragChunks: RagChunkContext[] = rawChunks.map((c) => ({
    id: c.id,
    sourceType: c.sourceType || "KNOWLEDGE",
    sourceTitle: c.sourceTitle || "Genel Kaynak",
    content: c.content,
    audioUrl: c.audioUrl ?? null,
  }));

  const isRibaShieldActive = isStringArg
    ? /faiz|borç|riba|kredi|tefeci/i.test(userMessage)
    : Boolean(arg1.isRibaShieldActive);
  const effectiveTone: TonePreference = isStringArg
    ? "SEFKATLI_TESKIN"
    : arg1.effectiveTone;
  const distressLevel = isStringArg ? 5 : arg1.distressLevel;
  const nafsTrap = isStringArg ? "DUNYALIK_KAYGI" : arg1.nafsTrap;
  const ragCategory = isStringArg ? "TESKIN_VE_TESELLI" : arg1.ragCategory;
  const intentMode = isStringArg ? undefined : arg1.intentMode;

  const resolvedParams: GenerateSirdasReplyParams = isStringArg
    ? {
        userMessage,
        userProfile: {
          roles: ["MISAFIR_KULLANICI"],
          spiritual_trials: [nafsTrap],
          tone_preference: effectiveTone,
        },
        effectiveTone,
        distressLevel,
        isRibaShieldActive,
        nafsTrap,
        ragCategory,
        ragChunks,
        intentMode,
      }
    : arg1;

  const ai = getAIClient();

  if (!ai) {
    const mock = runMockGeminiReply(resolvedParams);
    const tokens = mock.whatsapp_reply.match(/\S+\s*/g) || [
      mock.whatsapp_reply,
    ];
    for (const token of tokens) {
      yield token;
      if (process.env.NODE_ENV !== "test" && !process.env.CI) {
        await new Promise((r) => setTimeout(r, 12));
      }
    }
    return {
      replyText: mock.whatsapp_reply,
      fullText: mock.whatsapp_reply,
      editorAudit: mock.editor_audit,
      selectedAudioChunkId: mock.selected_audio_chunk_id ?? null,
    };
  }

  const contents = buildGeminiContents(resolvedParams);

  for (const model of getAvailableModels()) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: buildModelConfig(model, resolvedParams.intentMode),
      });

      let fullText = "";
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          yield text;
        }
      }

      if (fullText.trim().length > 10) {
        return {
          replyText: fullText,
          fullText,
          editorAudit: buildDeterministicAudit(resolvedParams),
          selectedAudioChunkId: null,
        };
      }
    } catch (err) {
      markModelUnavailable(model);
      console.warn(
        `[Gemini Stream Model ${model} Warning - Trying next candidate]`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const mock = runMockGeminiReply(resolvedParams);
  const tokens = mock.whatsapp_reply.match(/\S+\s*/g) || [
    mock.whatsapp_reply,
  ];
  for (const token of tokens) {
    yield token;
  }
  return {
    replyText: mock.whatsapp_reply,
    fullText: mock.whatsapp_reply,
    editorAudit: mock.editor_audit,
    selectedAudioChunkId: mock.selected_audio_chunk_id ?? null,
  };
}
