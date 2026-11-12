import type { JevAnalysisResult } from "@/lib/ai/jev-client";
import type { GuardrailIntercept } from "@/lib/ai/rag-pipeline";
import type { SafetyTriageResult } from "./triage";

/**
 * Güvenlik ön süzgecinin "modeli atla" kararını, sohbet akışındaki mevcut
 * kalkan (intercept) biçimine çevirir. Böylece kayıt ve yanıt akışı aynı yoldan yürür.
 */
export function buildSafetyIntercept(
  triage: SafetyTriageResult | null,
  jevResult: JevAnalysisResult
): GuardrailIntercept | null {
  if (!triage || !triage.bypassModel || !triage.replyText) return null;

  const isCrisis = triage.status === "crisis_redirected";
  const isViolence =
    triage.category === "ABUSE_VICTIM" || triage.category === "HARM_TO_OTHERS";

  return {
    status: triage.status,
    ruleId: triage.ruleId,
    replyText: triage.replyText,
    extraFlags: isCrisis
      ? {
          crisis_redirect: true,
          ...(isViolence ? { bypassed_to_violence_block: true } : {}),
        }
      : {},
    editorAudit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed: triage.ruleId,
      siyer_example_used: "Güvenlik Ön Süzgeci",
      riba_warning_included: false,
      nafs_trap: jevResult.nafs_trap,
      rag_category: jevResult.rag_category,
      distress_level: isCrisis ? 10 : jevResult.distress_level,
      tone: "SEFKATLI_TESKIN",
      spiritual_stage: isCrisis
        ? "DARLIK_VE_BUNALIM"
        : jevResult.spiritual_stage || "ARAYIS_VE_BASLANGIC",
    },
  };
}
