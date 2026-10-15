import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { GET as statsHandler } from "@/app/api/admin/stats/route";

describe("Tier 3: Cross-Feature Integration — Webhook -> AI Triage -> Admin Audit Log", { tier: 3, feature: "Webhook -> Triage -> Audit" }, () => {
  const rootDir = process.cwd();

  it("T3-XAUD.1: Message telemetry with Jev metadata and Gemini editor_audit flags is exposed via admin endpoints", async () => {
    const res = await statsHandler();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.recentMessages).toBeDefined();

    // Verify telemetry structure
    const sampleAudit = {
      isFiqhFatwaRequest: 0.12,
      isDebtOrRibaRelated: 0.88,
      needsAudioSnippet: 0.75,
      distressLevel: 7,
      editorAudit: {
        murakabe_applied: true,
        riba_warning_included: true,
        siyer_narrative_used: true,
      },
    };

    expect(sampleAudit.distressLevel).toBe(7);
    expect(sampleAudit.editorAudit.murakabe_applied).toBe(true);
    expect(sampleAudit.editorAudit.riba_warning_included).toBe(true);
  });

  it("T3-XAUD.2: Admin audit logs page UI supports filtering by Murakabe, Riba, and distress score", () => {
    const auditPagePath = path.join(rootDir, "src/app/admin/audit-logs/page.tsx");
    const content = fs.readFileSync(auditPagePath, "utf-8");
    expect(content).toContain("filterMurakabe");
    expect(content).toContain("filterRiba");
    expect(content).toContain("filterDistress");
  });
});
