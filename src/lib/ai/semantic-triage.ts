import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import { NafsTrap, SpiritualStage, TonePreference } from "./jev-taxonomy";

export interface SemanticTriageResult {
  nafsTrap: NafsTrap;
  spiritualStage: SpiritualStage;
  distressLevel: number;
  recommendedTone: TonePreference;
  underlyingNeed: string;
  spiritualDiagnosis: string;
}

let aiClient: GoogleGenAI | null = null;
let triageOfflineUntil = 0;

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
 * Asynchronous deep semantic triage using gemini-3.5-flash-lite.
 * Runs non-blocking / fire-and-forget so user TTFT is 0ms affected.
 */
export async function runSemanticTriage(params: {
  userMessage: string;
  conversationHistorySnippet?: string;
}): Promise<SemanticTriageResult | null> {
  const client = getAIClient();
  if (!client || Date.now() < triageOfflineUntil) {
    return null;
  }

  const prompt = `Sen İslami irfan ve manevi rehberlik alanında uzman bir manevi triyaj hekimisin.
Kullanıcının yazdığı mesajın ardındaki hakiki derdi, kalbi ihtiyacı ve nefis imtihanını analiz et.

Kullanıcı Mesajı: "${params.userMessage}"
${params.conversationHistorySnippet ? `Önceki Bağlam: ${params.conversationHistorySnippet}` : ""}

Aşağıdaki JSON şemasına harfiyen uygun olarak Türkçe yanıt ver:
{
  "nafsTrap": "Kullanıcının haliyle en çok örtüşen nefis tuzağı. Seçenekler: FAKIRLIK_KORKUSU_VESVESESI, GIZLI_KIBIR_HAKLILIK, UMITSIZLIK_KARAMSARLIK, INTIKAM_VE_HASET, ELALEM_NE_DER_RIYA, REHAVET_TEMBELLIK, KADERE_ITIRAZ_VE_ISYAN, ACELECI_TALEPLER_VE_ISTIACAL, ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK, UCUB_VE_AMELINE_GUVENME, KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK, GIZLI_SIRK_VE_SAHTE_SIGINAKLAR, SUI_ZAN_VE_TECESSUS, MINNET_VE_BASA_KAKMA, KAYITSIZLIK_VE_MERHAMETSIZLIK, GECMISIN_PISMANLIK_GIRDABI, TUL_I_EMEL_VE_GAYETSIZLIK, VESVESE_VE_GUSUL_ABDEST_EVHAMI, KOLAY_KAZANC_HIRSI, CIMRILIK_VE_MAL_HIRSI, HAYIR_DIYEMEME_ZAAFI, DUNYALIK_KAYGI",
  "spiritualStage": "DARLIK_VE_BUNALIM | ARAYIS_VE_BASLANGIC | MUHASEBE_VE_TEVBE | DERINLESMIS_SALIK | ISTIKAMET_VE_INSA",
  "distressLevel": 1-10 arası tamsayı (1: sakin, 5: kaygılı/bunalmış, 10: ağır çaresizlik/çöküş),
  "recommendedTone": "SEFKATLI_TESKIN | DIRILIS_VE_GAYRET | NET_VE_MUALLIM | HIKMETLI_SUKUT | TAVIZSIZ_MUALLIM",
  "underlyingNeed": "Kullanıcının en derin manevi ihtiyacı (1 özlü cümle)",
  "spiritualDiagnosis": "Kısa manevi teşhis özeti (1 duru cümle)"
}`;

  try {
    const res = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 250,
        abortSignal: AbortSignal.timeout(6000),
      },
    });

    const text = res.text?.trim() || "";
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      nafsTrap: parsed.nafsTrap as NafsTrap,
      spiritualStage: parsed.spiritualStage as SpiritualStage,
      distressLevel: Math.min(10, Math.max(1, Number(parsed.distressLevel) || 5)),
      recommendedTone: parsed.recommendedTone as TonePreference,
      underlyingNeed: String(parsed.underlyingNeed || "").trim(),
      spiritualDiagnosis: String(parsed.spiritualDiagnosis || "").trim(),
    };
  } catch (err) {
    triageOfflineUntil = Date.now() + 30_000;
    console.warn(
      "[Semantic Triage Warning - Non-blocking fallback triggered]:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Fire-and-forget background dispatcher.
 * Enriches user.profileMetadata and message.editorAudit in PostgreSQL
 * without blocking or delaying the user's active streaming response.
 */
export function dispatchBackgroundTriage(params: {
  userKey: string;
  assistantMessageId?: string;
  userMessage: string;
  conversationHistorySnippet?: string;
}): void {
  // Run asynchronously without awaiting in request lifecycle
  Promise.resolve().then(async () => {
    try {
      const triage = await runSemanticTriage({
        userMessage: params.userMessage,
        conversationHistorySnippet: params.conversationHistorySnippet,
      });

      if (!triage) return;

      // 1. Update user profile metadata
      const user = await prisma.user.findUnique({
        where: { phoneNumber: params.userKey },
      });

      if (user) {
        const currentMeta = (user.profileMetadata as Record<string, unknown>) || {};
        const updatedMeta = {
          ...currentMeta,
          spiritual_trials: Array.from(
            new Set([...((currentMeta.spiritual_trials as string[]) || []), triage.nafsTrap])
          ),
          spiritual_stage: triage.spiritualStage,
          tone_preference: triage.recommendedTone,
          latest_deep_triage: {
            ...triage,
            triagedAt: new Date().toISOString(),
          },
        };

        await prisma.user.update({
          where: { phoneNumber: params.userKey },
          data: { profileMetadata: JSON.parse(JSON.stringify(updatedMeta)) },
        });
      }

      // 2. If assistantMessageId provided, enrich editorAudit
      if (params.assistantMessageId) {
        const msg = await prisma.message.findUnique({
          where: { id: params.assistantMessageId },
        });

        if (msg) {
          const currentAudit = (msg.editorAudit as Record<string, unknown>) || {};
          await prisma.message.update({
            where: { id: params.assistantMessageId },
            data: {
              editorAudit: JSON.parse(
                JSON.stringify({
                  ...currentAudit,
                  deepTriage: triage,
                })
              ),
            },
          });
        }
      }
    } catch (err) {
      console.warn("[Background Triage Execution Error]", err);
    }
  }).catch(() => {});
}
