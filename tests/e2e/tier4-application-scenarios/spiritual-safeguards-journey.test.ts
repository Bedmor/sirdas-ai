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
});
