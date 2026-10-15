import { GoogleGenAI } from "@google/genai";
import { SIRDAS_SYSTEM_CONSTITUTION } from "./constitution";
import { SirdasOutputSchema, SirdasOutput, SIRDAS_OUTPUT_JSON_SCHEMA } from "./schemas";

let aiClient: GoogleGenAI | null = null;
let cachedConstitutionName: string | undefined = undefined;

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

/**
 * Sistem Anayasası için Context Cache oluşturma / alma (Maliyet düşürme & Düşük Latency)
 */
export async function getOrCreateConstitutionCache(): Promise<string | undefined> {
  if (cachedConstitutionName) return cachedConstitutionName;

  const ai = getAIClient();
  if (!ai) return undefined;

  try {
    const cache = await ai.caches.create({
      model: "gemini-2.5-flash",
      config: {
        displayName: "sirdas_constitution_cache",
        ttl: "86400s", // 24 saatlik önbellek
        systemInstruction: SIRDAS_SYSTEM_CONSTITUTION
      }
    });
    cachedConstitutionName = cache.name;
    return cachedConstitutionName;
  } catch (error) {
    console.warn("[Gemini Cache Init Warning - Continuing with inline constitution]", error);
    return undefined; // Cache desteklenmezse inline devam eder
  }
}

export interface GenerateSirdasReplyParams {
  userMessage: string;
  userProfile: any;
  effectiveTone: "SEFKATLI_TESKIN" | "TAVIZSIZ_MUALLIM";
  distressLevel: number;
  isRibaShieldActive: boolean;
  nafsTrap: string;
  ragCategory: string;
  ragChunks: Array<{
    id: string;
    sourceType: string;
    sourceTitle: string;
    content: string;
    audioUrl?: string | null;
  }>;
}

export async function generateSirdasReply(params: GenerateSirdasReplyParams): Promise<SirdasOutput> {
  const ai = getAIClient();

  // Test veya API anahtarsız lokal ortamlar için akıllı manevi simülatör
  if (!ai) {
    return runMockGeminiReply(params);
  }

  const cacheName = await getOrCreateConstitutionCache();

  const ragContextText = params.ragChunks
    .map(
      (chunk, idx) => `
[KAYNAK ${idx + 1} - ${chunk.sourceType} - ${chunk.sourceTitle} (ID: ${chunk.id})]
${chunk.content}
${chunk.audioUrl ? `(Ses Dosyası Mevcut: ${chunk.audioUrl})` : ""}
`
    )
    .join("\n---\n");

  const prompt = `
# KULLANICI DİJİTAL İKİZ KÜNYESİ
- Sosyal Roller: ${JSON.stringify(params.userProfile?.roles || [])}
- Ruhsal İmtihanlar: ${JSON.stringify(params.userProfile?.spiritual_trials || [])}
- Biyolojik Enerji Durumu: ${JSON.stringify(params.userProfile?.biological_energy || [])}
- İstenen Hitabet Üslubu: ${params.effectiveTone} (Kriz Puanı: ${params.distressLevel}/10)

# SYSTEM 1 (JEV) TEŞHİS RAPORU
- Tespit Edilen Nefis Tuzağı: ${params.nafsTrap}
- İlgili RAG Kategorisi: ${params.ragCategory}
- Riba Kalkanı Durumu: ${params.isRibaShieldActive ? "AKTİF (Faiz uyarısı ve Bakara 275-279 zorunludur)" : "PASİF"}

# ÇELİK KASA RAG BAĞLAMI
${ragContextText || "Doğrudan temel Kur'an ve Sünnet hikmetiyle konuşulacaktır."}

# KULLANICI MESAJI
"${params.userMessage}"

${
  params.isRibaShieldActive
    ? `
DİKKAT: RIBA_SHIELD_ACTIVE = TRUE!
Cevabında faizin dünyevi ve uhrevi felaketini, Allah ve Resulü'ne karşı açılmış savaş ihtarını, şeytan çarpmış gibi ruhi dengeyi bozmasını ve samimi tövbe ile bereket kapısının açılacağını cevabın kalbine yerleştirmek ZORUNDASIN. editor_audit.riba_warning_included alanını true yap.
`
    : ""
}

Yukarıdaki şartnameye ve Sistem Anayasası'na %100 uyarak yapılandırılmış JSON çıktısını üret.
`;

  try {
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: SIRDAS_OUTPUT_JSON_SCHEMA
    };

    if (cacheName) {
      config.cachedContent = cacheName;
    } else {
      config.systemInstruction = SIRDAS_SYSTEM_CONSTITUTION;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config
    });

    const parsed = JSON.parse(response.text || "{}");
    return SirdasOutputSchema.parse(parsed);
  } catch (error) {
    console.warn("[Gemini API Error - Falling back to local spiritual reply]", error);
    return runMockGeminiReply(params);
  }
}

/**
 * Lokal geliştirme, CI/CD ve acil durumlarda devreye giren şer'i ve manevi zengin cevher motoru
 */
export function runMockGeminiReply(params: GenerateSirdasReplyParams): SirdasOutput {
  const isRiba = params.isRibaShieldActive;
  const halisAudioChunk = params.ragChunks.find(c => c.sourceType === "HALIS_AYDEMIR" && c.audioUrl);

  let whatsappReply = "";
  if (isRiba) {
    whatsappReply =
      `*Aziz kardeşim, gönlünü daraltan borç ve faiz çıkmazını duyuyorum...*\n\n` +
      `Cenâb-ı Hak ferman buyurur: _“Faiz yiyenler, ancak şeytan çarpmış kimsenin kalktığı gibi kalkarlar...”_ (Bakara, 275). ` +
      `Faiz sarmalı, kulun bereketini mahveden ve Allah ile Resulü'ne harp açan bir gaflettir. ` +
      `Maddi çıkmazın çaresi faizi faizle kapatmak değil; derhal bu ateşe tövbe edip helal rızka ve infak bereketine sığınmaktır.\n\n` +
      `Peygamber Efendimiz (s.a.v.) borçtan daralan ashabına şöyle dua etmeyi buyururdu:\n` +
      `_“Allah’ım! Kederden, hüzünden, acizlikten, tembellikten, korkaklıktan, cimrilikten, borcun belimi bükmesinden ve insanların bana galebe çalmasından Sana sığınırım.”_\n\n` +
      `Rabbimiz Talâk Suresi'nde müjdeler: *“Kim Allah’tan sakınırsa, O ona bir çıkış yolu ihsan eder ve onu beklemediği yerden rızıklandırır.”*\n\n` +
      `Şimdi elini vicdanına koy; faizli tüm kapıları niyetinde kapat, sebeplere meşru yoldan sarıl ve neticeyi Rezzâk-ı Mutlak olan Allah'a havale et. O'nun hazinesi geniştir.`;
  } else {
    whatsappReply =
      `*Kıymetli dostum, gönlündeki daralma aslında kalbini bir sığınağa davet ediyor...*\n\n` +
      `Dünya bir mükâfat yurdu değil, nefsin arınma ve terbiye meydanıdır. ` +
      `Uğradığın haksızlık veya hissettiğin yorgunluk fânidir; El-Adl ve El-Bâkî olan Allah zerre kadar kul hakkını zayi etmez.\n\n` +
      `Taif'te taşlandığında dahi intikam değil hidayet dileyen Rahmet Peygamberi'nin (s.a.v.) sabrını hatırla. ` +
      `Gecenin seherinde abdestini alıp iki rekat sekinet namazıyla Rabbine iltica etmeyi dener misin? ` +
      `Yükünü tek başına taşımaya çalışma; Kadir-i Mutlak olan O'na tevekkül et.`;
  }

  return {
    editor_audit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed: params.nafsTrap,
      siyer_example_used: isRiba ? "Efendimiz'in (s.a.v.) borç ve kederden sığınma duası" : "Taif dönüşü Efendimiz'in (s.a.v.) tevekkülü",
      riba_warning_included: isRiba
    },
    whatsapp_reply: whatsappReply,
    profile_updates: {
      new_roles: [],
      new_weaknesses: [params.nafsTrap]
    },
    selected_audio_chunk_id: halisAudioChunk ? halisAudioChunk.id : null
  };
}
