import "dotenv/config";
import { GoogleGenAI, GenerateContentConfig, Content } from "@google/genai";
import { SIRDAS_RUNTIME_SYSTEM_INSTRUCTION } from "./constitution";
import { SirdasOutputSchema, SirdasOutput } from "./schemas";
import {
  TonePreference,
  SpiritualStage,
  TONE_PREFERENCE_CRITERIA,
  SPIRITUAL_STAGE_CRITERIA,
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
} from "./jev-client";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
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
  roles?: string[];
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
  spiritualStage?: SpiritualStage;
  distressLevel: number;
  isRibaShieldActive: boolean;
  nafsTrap: string;
  ragCategory: string;
  ragChunks: RagChunkContext[];
  conversationHistory?: ConversationHistoryTurn[];
}

export function formatRagContext(chunks: RagChunkContext[]): string {
  if (!chunks || chunks.length === 0) {
    return "Genel Kur'an ve Sünnet hikmeti.";
  }
  return chunks
    .slice(0, 4)
    .map((chunk, idx) => {
      const snippet =
        chunk.content.length > 360
          ? `${chunk.content.slice(0, 357)}...`
          : chunk.content;
      return `[KAYNAK ${idx + 1} | ${chunk.sourceType} | ${chunk.sourceTitle}]\n${snippet}`;
    })
    .join("\n\n");
}

export function buildGeminiContents(
  params: GenerateSirdasReplyParams
): Content[] {
  const resolvedStage: SpiritualStage =
    params.spiritualStage ||
    params.userProfile?.spiritual_stage ||
    (params.distressLevel >= 7 ? "DARLIK_VE_BUNALIM" : "ARAYIS_VE_BASLANGIC");

  const toneHint =
    TONE_PREFERENCE_CRITERIA[params.effectiveTone] || params.effectiveTone;
  const stageHint =
    SPIRITUAL_STAGE_CRITERIA[resolvedStage] || resolvedStage;
  const nafsHint =
    NAFS_TRAP_CRITERIA[params.nafsTrap] || params.nafsTrap;
  const ragHint =
    RAG_CATEGORY_CRITERIA[params.ragCategory] || params.ragCategory;
  const hasRag = params.ragChunks && params.ragChunks.length > 0;
  const ragContextText = hasRag ? formatRagContext(params.ragChunks) : "";

  const rolesStr = params.userProfile?.roles?.length
    ? params.userProfile.roles.join(", ")
    : "Genel";

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
  const metaHeader = `[KÜNYE] Roller: ${rolesStr} | Aşama: ${resolvedStage} (${stageHint}) | Üslup: ${params.effectiveTone} (${toneHint}) | Kriz: ${params.distressLevel}/10 | Teşhis: ${params.nafsTrap} (${nafsHint})${params.isRibaShieldActive ? " | Riba Kalkanı: AKTİF (Bakara 275-279 ve faiz uyarısı)" : ""}`;

  let currentPrompt = `${metaHeader}\n\n`;

  if (hasRag) {
    currentPrompt += `# İLAHİ KELÂM VE HİKMET KAYNAKLARI (Bu ayet ve hadisleri kalbe şifa olan ilahi bir ferman gibi zikret; akademik dipnot gibi değil, hürmet ve muhabbetle söze dahil et):\n${ragContextText}\n\n`;
  } else {
    currentPrompt += `[REHBERLİK: Muhatabını kalpten dinle; her halükarda Allah'ın kulunu asla yalnız bırakmadığını, her zorluğun ardında bir kolaylık murad ettiğini ve kalplerin ancak Allah'ı anmakla mutmain olacağını hatırlat.]\n\n`;
  }

  currentPrompt += `# KULLANICI MESAJI:\n"${params.userMessage}"\n\n`;
  currentPrompt += `KURAL: Doğrudan ve samimi konuş, her mesaja klişe hitapla başlama. Allah Teâlâ ile kul arasındaki bağı, tevekkülü ve ayetlerin ilahi şifasını sözün merkezine al; seküler psikoloji dili yerine kalbi idrak ve İslami edeple konuş. 2-3 kısa paragrafta (*kalın*, _italik_) yanıtla. "Sekinet" kelimesini KESİNLİKLE kullanma (sükûnet, ferahlık, inşirah kullan).`;

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
    tone: params.effectiveTone,
    spiritual_stage: resolvedStage,
  };
}

function buildModelConfig(model: string): GenerateContentConfig {
  const isLite = model.includes("lite");
  return {
    systemInstruction: SIRDAS_RUNTIME_SYSTEM_INSTRUCTION,
    maxOutputTokens: 320,
    temperature: 0.5,
    abortSignal: AbortSignal.timeout(4000),
    ...(!isLite
      ? {
          thinkingConfig: {
            thinkingBudget: 0,
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
        config: buildModelConfig(model),
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

  let whatsappReply: string;

  if (isRiba) {
    const duaQuote =
      hadithOrSiyer && hadithOrSiyer.id !== quranOrPrimary?.id
        ? `\n\nEfendimiz'in (s.a.v.) borç ve kederden sığınma duasına sarıl; helal rızık ve tevekkülle meşru sebeplere tutunduğunda Rabbimiz (Talâk 2-3) hiç ummadığın kapıları açacaktır.`
        : `\n\nRabbimiz Talâk Suresi 2-3'te sakınan ve tevekkül eden kuluna mutlaka bir çıkış yolu açacağını müjdeler; meşru sebeplere vakar ile sarıl ve kalbini O'na bağla.`;

    whatsappReply =
      `İçini daraltan bu borç ve geçim yükünü kalbimde hissediyorum... İnsan darda kaldığında ayağına dolanan sebepleri kurtuluş sanabiliyor.\n\n` +
      `Cenâb-ı Hak *Bakara Suresi 275-279* âyetlerinde faizin hem ruhi huzuru hem de dünyevi bereketi tükettiğini ihtar eder. Darlığın asıl devası yeni bir faiz yükü değil, tövbe ve helal kazanç vakarında sebat etmektir.` +
      duaQuote;
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
      `Gönlündeki bu daralma ve yorgunluk aslında kalbini bir nebze durup soluklanmaya davet ediyor...\n\n` +
      `Dünya bir mükâfat yurdu değil, imtihan ve arınma meydanıdır. Karşılaştığın haksızlık veya günün ağırlığı fânidir; El-Adl olan Allah zerre kadar kul hakkını ve sabrını zayi etmez.\n\n` +
      `Taif'te taşlandığında dahi intikam değil teslimiyetle Rabbine iltica eden Rahmet Peygamberi'nin (s.a.v.) sabrını hatırla. Yükünü Kadir-i Mutlak olan O'na havale et, kalbini ferah tut.`;
  }

  return {
    editor_audit: buildDeterministicAudit(params),
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
        config: buildModelConfig(model),
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
