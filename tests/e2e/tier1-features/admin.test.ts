import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";
import { createMockRequest, parseCsv } from "../harness/utils";
import { GET as statsHandler } from "@/app/api/admin/stats/route";
import { GET as vasExportHandler } from "@/app/api/admin/vas-export/route";
import { GET as knowledgeHandler } from "@/app/api/admin/knowledge/route";

describe("Tier 1: Feature Coverage — Admin & Analytics Dashboard", { tier: 1, feature: "Admin" }, () => {
  const rootDir = process.cwd();

  it("T1-ADM.1: Admin stats endpoint returns comprehensive system KPIs and recent streams", async () => {
    const res = await statsHandler();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.users.total).toBeGreaterThanOrEqual(0);
    expect(json.data.messages.total).toBeGreaterThanOrEqual(0);
    expect(json.data.donations.poolBalance).toBeGreaterThanOrEqual(0);
    expect(json.data.vas.incomingCount).toBeGreaterThan(0);
    expect(json.data.knowledge.totalChunks).toBeGreaterThanOrEqual(0);
  });

  it("T1-ADM.2: VAS export API produces RFC 4180 compliant CSV stream with mandatory headers", async () => {
    const req = createMockRequest("http://localhost:3000/api/admin/vas-export?format=csv");
    const res = await vasExportHandler(req);
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type") || "";
    expect(contentType).toContain("text/csv");

    const csvText = await res.text();
    const { headers, rows } = parseCsv(csvText);

    expect(headers).toContain("Kayit_ID");
    expect(headers).toContain("Tarih");
    expect(headers).toContain("Gelen_Mesaj_Adedi");
    expect(headers).toContain("Giden_Mesaj_Adedi");
    expect(headers).toContain("Operator_Esdeger_Dakika");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("T1-ADM.3: VAS export API provides structured JSON format for GSM operator reconciliation", async () => {
    const req = createMockRequest("http://localhost:3000/api/admin/vas-export?format=json");
    const res = await vasExportHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.count).toBeGreaterThan(0);

    const sample = json.data[0];
    expect(sample.id).toBeDefined();
    expect(sample.incomingCount).toBeGreaterThan(0);
    expect(sample.outgoingCount).toBeGreaterThan(0);
    expect(sample.estimatedMinutes).toBeGreaterThan(0);
  });

  it("T1-ADM.4: Çelik Kasa Knowledge API filters records by category and keyword search", async () => {
    const quranReq = createMockRequest("http://localhost:3000/api/admin/knowledge?sourceType=QURAN");
    const quranRes = await knowledgeHandler(quranReq);
    expect(quranRes.status).toBe(200);
    const quranJson = await quranRes.json();
    expect(quranJson.success).toBe(true);
    expect(quranJson.data.every((c: any) => c.sourceType === "QURAN")).toBe(true);

    const searchReq = createMockRequest("http://localhost:3000/api/admin/knowledge?search=faiz");
    const searchRes = await knowledgeHandler(searchReq);
    expect(searchRes.status).toBe(200);
    const searchJson = await searchRes.json();
    expect(searchJson.data.some((c: any) => c.isRibaRelated === true)).toBe(true);
  });

  it("T1-ADM.5: Çelik Kasa audio chunks provide valid audioUrl, startSec, and endSec metadata", async () => {
    const audioReq = createMockRequest("http://localhost:3000/api/admin/knowledge?sourceType=HALIS_AYDEMIR");
    const audioRes = await knowledgeHandler(audioReq);
    expect(audioRes.status).toBe(200);

    const json = await audioRes.json();
    expect(json.data.length).toBeGreaterThan(0);

    for (const chunk of json.data) {
      expect(chunk.audioUrl).toMatch(/\.ogg$/);
      expect(chunk.startSec).toBeDefined();
      expect(chunk.endSec).toBeDefined();
      expect(chunk.endSec).toBeGreaterThan(chunk.startSec);
    }
  });

  it("T1-ADM.6: Admin audit log component implements telemetry filtering and Jev/Gemini audit flags", () => {
    const auditPagePath = path.join(rootDir, "src/app/admin/audit-logs/page.tsx");
    expect(fs.existsSync(auditPagePath)).toBe(true);

    const auditContent = fs.readFileSync(auditPagePath, "utf-8");
    expect(auditContent).toContain("Murakabe");
    expect(auditContent).toContain("Riba");
    expect(auditContent).toContain("Fetva");
    expect(auditContent).toContain("Distress");
    expect(auditContent).toContain("editorAudit");
  });
});
