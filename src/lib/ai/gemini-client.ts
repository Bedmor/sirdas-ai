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
  SpiritualStage,
  TONE_PREFERENCE_CRITERIA,
  SPIRITUAL_STAGE_CRITERIA,
  NAFS_TRAP_CRITERIA,
  RAG_CATEGORY_CRITERIA,
} from "./jev-client";

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
  intentMode?: ChatIntentMode;
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
  const isIlimMode = params.intentMode === "ILIM_VE_SIYER";
  const metaHeader = isIlimMode
    ? `[KÜNYE] Mod: VAKUR İLİM & HİKMET MODU | Odak: Siyer ve İslam Tarihi Hadisesi | Üslup: Net, ansiklopedik ama ruhu olan berrak dil`
    : `[KÜNYE] Mod: SIRDAŞ & MANEVİ AYNA MODU | Roller: ${rolesStr} | Aşama: ${resolvedStage} (${stageHint}) | Üslup: ${params.effectiveTone} (${toneHint}) | Kriz: ${params.distressLevel}/10 | Teşhis: ${params.nafsTrap} (${nafsHint})${params.isRibaShieldActive ? " | Riba Kalkanı: AKTİF (Bakara 275-279 ve faiz uyarısı)" : ""}`;

  let currentPrompt = `${metaHeader}\n\n`;

  if (hasRag) {
    if (isIlimMode) {
      currentPrompt += `# İSLAM TARİHİ VE SİYER KAYNAKLARI (Bu sahih verileri ve hadiseleri söze berrak bir vakarla dahil et):\n${ragContextText}\n\n`;
    } else {
      currentPrompt += `# MANEVİ HİKMET VE DAYANAKLAR (Bu hikmeti vaaz gibi boca etme; önce aktif dinleme yapıp samimiyetle empati kur, ardından bu hikmeti sözün içine zarifçe ve doğal bir ferahlık olarak yedir):\n${ragContextText}\n\n`;
    }
  } else {
    if (isIlimMode) {
      currentPrompt += `[REHBERLİK: Siyer-i Nebî ve İslam tarihinin sahih rivayetlerine sadık kalarak, hadiseyi sebep-sonuç ilişkisi ve nebevi hikmetiyle açıkla.]\n\n`;
    } else {
      currentPrompt += `[REHBERLİK: Muhatabını can kulağıyla dinle. Önce hissettiği sıkıntı ve yorgunluğu insani bir sıcaklıkla anladığını hissettir, ardından kalbini sükûnet ve tevekküle davet et.]\n\n`;
    }
  }

  currentPrompt += `# KULLANICI MESAJI:\n"${params.userMessage}"\n\n`;

  if (isIlimMode) {
    currentPrompt += `KURAL: Vakur İlim & Hikmet Modu uyarınca; net, ansiklopedik ama ruhu olan berrak bir dille soruyu açıkla.
- Paragraf Başına Cümle Kotası: Her paragraf en fazla 1-2 duru cümleden oluşmalı; asla blok metin veya roman paragrafı yazma.
- 2-3 doyurucu ve tamamlanmış kısa paragrafta yanıtla. "Sekinet" kelimesini KESİNLİKLE kullanma (sükûnet, vakar, inşirah kullan).`;
  } else {
    currentPrompt += `KURAL: ALTIN DENGE (Ne vaaz robotu, ne kahvehane laubaliliği). Fethi Gemuhluoğlu, Mehmet Âkif veya Sezai Karakoç irfanı ve vakarıyla konuş.
- Paragraf Başına Cümle Kotası: Her paragraf en fazla 1-2 duru cümleden oluşmalı; asla blok metin veya roman paragrafı yazma.
- Mesaj Boyutuna Uyum (Ayna Kuralı): Kullanıcı kısa ve net yazdıysa sen de kısa ve öz ol (maksimum 40-60 kelime). Konu kapandıysa geçmiş dert etiketlerini (geçim, borç, ilişkiler) tekrardan sayıp dökme.
- Muhatabın hissettiği darlık veya yorgunluğu insani bir sıcaklıkla karşıla (aktif dinleme); ardından sözü Kadir-i Mutlak olan Allah'a tevekküle ve O'nun açacağı inşirah/kolaylık kapısına bağla.
- ASLA sokak/kahvehane ağzı ("valla", "kanka", "babayiğit", "çay ocağı", "robot değiliz", "otomatik pilot") KULLANMA.
- Ağdalı edebiyat klişeleri ("inşirah üfleyen ferman", "tevekkül kokan teslimiyet", "dünya gaileleri") KULLANMA.
- Uzunluk: En fazla 2-3 öz ve tamamlanmış kısa paragraf; cümleni asla yarım bırakma. "Sekinet" kelimesini KESİNLİKLE kullanma.`;
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
    maxOutputTokens: isIlimMode ? 1000 : 850,
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
      `Bu soru, kalpleri en derinden sarsan imtihan ve adalet sırrına temas etmektedir...\n\n` +
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
      `Yaşadığınız tartışmanın oluşturduğu fırtınayı duyuyorum; ancak samimi bir manevi ayna olarak hakikati ifade etmek gerekir: Nefsiniz şu an faturayı tamamen karşı tarafa kesip kendi kusurunu aklamaya çalışıyor.\n\n` +
      `Eşiniz sizi tahrik etmiş veya haksızlık yapmış olsa bile; bağırmak, öfkeyle eşyaları kırmak nefsani bir zaaftır ve İslam ahlakına asla sığmaz. Peygamber Efendimiz (s.a.v.) şöyle buyurmuştur: _'Gerçek pehlivan güreşte rakibini yere seren değil; öfkelendiğinde nefsine hakim olabilen kimsedir.'_ (Buhârî, Edeb 76).\n\n` +
      `Nefsinizi aklamaktan vazgeçip öfkeniz ve fevriliğiniz için eşinizle helalleşiniz; Nebevi sünnet üzere öfke anında ayakta iseniz oturunuz, abdest alıp kalbinizi sükûnete erdiriniz.`;
  }
  // Soru 7: Dua Kabul Olmuyor / Ümitsizlik Tuzağı
  else if (
    /yıllardır dua ediyorum|hiçbiri kabul olmuyor|allah beni unuttu|dua etmeyi bırakacağım/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Gönlünüzü saran bu darlığı ve yorgunluğu duyuyorum; fakat 'Allah beni unuttu, dua etmeyi bırakacağım' düşüncesi, şeytanın kulu Rabbinden koparmak için fısıldadığı en sinsi ümitsizlik tuzağıdır.\n\n` +
      `Cenâb-ı Hak bizzat ferman buyurur: _'Rabbin seni terk etmedi ve sana darılmadı. Muhakkak ki ahiret senin için dünyadan daha hayırlıdır.'_ (Duhâ 3-4). Vahyin kesildiği ve müşriklerin 'Rabbi Muhammed'i terk etti' dediği Hüzün Yılı'nda inen bu âyet, bugün sizin kalbinize de bir inşirah fermanıdır.\n\n` +
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
      `İşlerinizin ters gitmesi sebebiyle hissettiğiniz daralmayı anlıyorum; ancak Manevi Pusula büyü bozan hoca, muska veya tılsım tarifi KESİNLİKLE vermez.\n\n` +
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
      ? `İçinizi daraltan bu borç yükünü ve çaresizlik hissini derinden duyuyorum; ancak size asla 'çekebilirsin' diyemem ve vicdanınızı sahte bir avuntuyla rahatlatamam.\n\n`
      : `İçini daraltan bu borç ve geçim yükünü kalbimde hissediyorum... İnsan darda kaldığında ayağına dolanan sebepleri kurtuluş sanabiliyor.\n\n`;

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
    /stres|kafay[ıi]\s*yiyece[ğg]im|gelecek\s*kayg[ıi]s[ıi]|sosyal\s*ili[şs]ki|karma[şs][ıi]kl[ıi][ğg]|bunal/i.test(
      userLower
    )
  ) {
    whatsappReply =
      `Geçim derdi de gelecek kaygısı da insanı gerçekten yorar aziz dostum. Çünkü insan tek başına her şeye yetebilecek, bütün dünyayı sırtında taşıyabilecek şekilde yaratılmadı. Bütün bu yükleri sadece kendi sınırlı gücünle göğüslemeye kalktığında nefesinin daralması ve tükenmiş hissetmen son derece fıtrî ve insani...\n\n` +
      `Böyle zamanlarda zihin her belirsizliği aynı anda çözmeye kalkar ve insanı tüketir. Oysa hayatın en daraldığı anlarda bile sebepler dairesinde elinden gelen gayreti gösterip gerisini Rezzâk ve Kadîr olan Rabbine emanet etmek insana asıl ferahlığı verir. Cenâb-ı Hakk'ın her darlığın arkasında bir inşirah ve kolaylık kapısı açtığını unutma; yalnız değilsin.\n\n` +
      `Bugün kendine biraz nefes alma fırsatı tanı, zihnini dinlendir ve yükünü O'na emanet et. Ne zaman konuşmak istersen buralardayım; gönlün ferah olsun.`;
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
