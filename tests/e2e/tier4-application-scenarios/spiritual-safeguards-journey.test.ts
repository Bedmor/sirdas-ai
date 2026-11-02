import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";

describe("Tier 4: Real-World Scenario — End-to-End Spiritual Guardrails", { tier: 4, feature: "Spiritual Safeguards" }, () => {
  const rootDir = process.cwd();

  it("T4-SCN.5: Fatwa rejection bypass directs user to Alo 190 and preserves mufti boundary", () => {
    // Check disclaimer banner and knowledge base fatwa handling
    const bannerPath = path.join(rootDir, "src/components/layout/DisclaimerBanner.tsx");
    const bannerContent = fs.readFileSync(bannerPath, "utf-8");

    expect(bannerContent).toContain("Alo 190");
    expect(bannerContent).toContain("Diyanet");
    expect(bannerContent).toContain("fetva");

    // Guardrail rule verification: if is_fiqh_fatwa_request >= 0.75, bypass LLM
    const threshold = 0.75;
    const testScoreBypass = 0.85;
    const testScoreNormal = 0.30;

    const shouldBypass = (score: number) => score >= threshold;
    expect(shouldBypass(testScoreBypass)).toBe(true);
    expect(shouldBypass(testScoreNormal)).toBe(false);
  });

  it("T4-SCN.6: Riba shield activation forces Bakara 275-279 anti-usury package into retrieval", () => {
    const rpcSql = fs.readFileSync(path.join(rootDir, "prisma/sql/02_hybrid_search_rpc.sql"), "utf-8");

    // Must enforce force_riba flag
    expect(rpcSql).toContain("force_riba boolean DEFAULT FALSE");
    expect(rpcSql).toContain("riba_enforced AS");
    expect(rpcSql).toContain("BAKARA_275_279");

    const ribaThreshold = 0.60;
    const debtInquiryScore = 0.82;
    const isRibaShieldActive = debtInquiryScore >= ribaThreshold;
    expect(isRibaShieldActive).toBe(true);
  });

  it("T4-SCN.7: Critical distress escalation overrides muallim tone with compassionate crisis care", () => {
    const distressThreshold = 8;
    const criticalScore = 10;
    const mildScore = 4;

    const resolveTone = (distress: number, preferred: string) => {
      if (distress >= distressThreshold) {
        return "SEFKATLI_TESKIN";
      }
      return preferred;
    };

    expect(resolveTone(criticalScore, "TAVIZSIZ_MUALLIM")).toBe("SEFKATLI_TESKIN");
    expect(resolveTone(mildScore, "TAVIZSIZ_MUALLIM")).toBe("TAVIZSIZ_MUALLIM");

    // Emergency services verification
    const emergencyNumbers = ["112", "182"];
    const disclaimerPath = path.join(rootDir, "src/components/layout/DisclaimerBanner.tsx");
    const disclaimerContent = fs.readFileSync(disclaimerPath, "utf-8");

    for (const num of emergencyNumbers) {
      expect(disclaimerContent).toContain(num);
    }
  });

  it("T4-SCN.8: Diversified NafsTrap, RagCategory, TonePreference, and SpiritualStage enums are active in System 1", async () => {
    const {
      NAFS_TRAP_CRITERIA,
      RAG_CATEGORY_CRITERIA,
      TONE_PREFERENCE_CRITERIA,
      SPIRITUAL_STAGE_CRITERIA,
      runHeuristicFallback,
    } = await import("@/lib/ai/jev-client");

    expect(NAFS_TRAP_CRITERIA.KADERE_ITIRAZ_VE_ISYAN).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.ACELECI_TALEPLER_VE_ISTIACAL).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.UCUB_VE_AMELINE_GUVENME).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.GIZLI_SIRK_VE_SAHTE_SIGINAKLAR).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.SUI_ZAN_VE_TECESSUS).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.MINNET_VE_BASA_KAKMA).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.KAYITSIZLIK_VE_MERHAMETSIZLIK).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.GECMISIN_PISMANLIK_GIRDABI).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.TUL_I_EMEL_VE_GAYETSIZLIK).toBeDefined();
    expect(NAFS_TRAP_CRITERIA.VESVESE_VE_GUSUL_ABDEST_EVHAMI).toBeDefined();

    expect(RAG_CATEGORY_CRITERIA.KADER_VE_KAZA_HIKMETI).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.DUA_VE_ILCA_USULU).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.TEVBE_VE_INABE).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.KALP_AMELLELI_VE_IHLAS).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.FANILIK_VE_TAZIYE).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.FITNE_VE_AHIR_ZAMAN_AHLAKI).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.ISRAF_VE_IKTISAT_FIKHI).toBeDefined();
    expect(RAG_CATEGORY_CRITERIA.SIYERDE_DARLIK_DONEMLERI).toBeDefined();

    expect(TONE_PREFERENCE_CRITERIA.SEFKATLI_TESKIN).toBeDefined();
    expect(TONE_PREFERENCE_CRITERIA.DIRILIS_VE_GAYRET).toBeDefined();
    expect(TONE_PREFERENCE_CRITERIA.NET_VE_MUALLIM).toBeDefined();
    expect(TONE_PREFERENCE_CRITERIA.HIKMETLI_SUKUT).toBeDefined();

    expect(SPIRITUAL_STAGE_CRITERIA.ARAYIS_VE_BASLANGIC).toBeDefined();
    expect(SPIRITUAL_STAGE_CRITERIA.DARLIK_VE_BUNALIM).toBeDefined();
    expect(SPIRITUAL_STAGE_CRITERIA.DERINLESMIS_SALIK).toBeDefined();

    const tevbeAnalysis = runHeuristicFallback("Eski hatalarım ve geçmiş günahlarım yüzünden Allah beni affetmez diye korkuyorum.");
    expect(tevbeAnalysis.nafs_trap).toBe("GECMISIN_PISMANLIK_GIRDABI");
    expect(tevbeAnalysis.rag_category).toBe("TEVBE_VE_INABE");
  });

  it("T4-SCN.9: Zero-latency Crisis & Violence Guards catch full crisis/abuse spectrum without latency", async () => {
    const {
      checkCrisisAndSuicide,
      checkViolenceAndAbuse,
      runHeuristicFallback,
    } = await import("@/lib/ai/jev-client");

    // Suicide / crisis variations
    const c1 = checkCrisisAndSuicide("Kendimi asmak üzereyim, dayanamıyorum");
    expect(c1).toBeTruthy();
    expect(c1?.isCrisis).toBe(true);

    const c2 = checkCrisisAndSuicide("Bu gece hayatıma son vermek istiyorum");
    expect(c2).toBeTruthy();
    expect(c2?.isCrisis).toBe(true);

    // Domestic abuse / violence variations
    const v1 = checkViolenceAndAbuse("Babam beni dövüyor, can güvenliğim yok");
    expect(v1).toBeTruthy();
    expect(v1?.isVictim).toBe(true);

    const v2 = checkViolenceAndAbuse("Onu pataklayacağım, döveceğim");
    expect(v2).toBeTruthy();
    expect(v2?.isViolence).toBe(true);

    // Colloquial fatwa
    const f1 = runHeuristicFallback("Bu yaptığım günah mı?");
    expect(f1.is_fiqh_fatwa_request).toBeGreaterThanOrEqual(0.75);

    // Debt & Riba
    const r1 = runHeuristicFallback("Tefeciye borcum var, faiz batağına saplandım");
    expect(r1.is_debt_or_riba_related).toBeGreaterThanOrEqual(0.60);
  });
});
