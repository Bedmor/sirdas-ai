import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";
import { createMockRequest } from "../harness/utils";
import { GET as knowledgeHandler } from "@/app/api/admin/knowledge/route";

describe("Tier 3: Cross-Feature Integration — UI Player to Audio URL", { tier: 3, feature: "UI Player -> Audio URL" }, () => {
  const rootDir = process.cwd();

  it("T3-XPLY.1: Admin knowledge API feeds Halis Aydemir audio chunks with valid URLs to the audio player", async () => {
    const req = createMockRequest("http://localhost:3000/api/admin/knowledge?sourceType=HALIS_AYDEMIR");
    const res = await knowledgeHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const audioChunk = json.data[0];
    expect(audioChunk.sourceType).toBe("HALIS_AYDEMIR");
    expect(audioChunk.audioUrl).toBeDefined();
    expect(audioChunk.audioUrl.startsWith("http")).toBe(true);
    expect(audioChunk.audioUrl.endsWith(".ogg")).toBe(true);
    expect(audioChunk.startSec).toBeGreaterThanOrEqual(0);
    expect(audioChunk.endSec).toBeGreaterThan(audioChunk.startSec);
  });

  it("T3-XPLY.2: Çelik Kasa Knowledge browser component renders audio player with controls and timestamps", () => {
    const knowledgePagePath = path.join(rootDir, "src/app/admin/knowledge/page.tsx");
    expect(fs.existsSync(knowledgePagePath)).toBe(true);

    const content = fs.readFileSync(knowledgePagePath, "utf-8");
    // Verifies audio element, play controls, and time display
    expect(content).toContain("<audio");
    expect(content).toContain("controls");
    expect(content).toContain("startSec");
    expect(content).toContain("endSec");
    expect(content).toContain('type="audio/ogg"');
  });
});
