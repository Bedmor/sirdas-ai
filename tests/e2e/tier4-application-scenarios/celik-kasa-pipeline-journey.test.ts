import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";
import { createSyntheticWavBuffer, chunkSegmentsSlidingWindow, AudioSegment, createMockRequest } from "../harness/utils";
import { getPublicAudioUrl } from "@/lib/storage/r2";
import { GET as knowledgeHandler } from "@/app/api/admin/knowledge/route";

describe("Tier 4: Real-World Scenario — Çelik Kasa Audio Pipeline Journey", { tier: 4, feature: "Audio Pipeline Journey" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";

  it("T4-SCN.3: End-to-end pipeline: Transcription chunks -> FFmpeg cut -> R2 metadata -> Admin playback", async () => {
    // 1. Simulate Halis Aydemir lecture transcribed into segments
    const segments: AudioSegment[] = [
      { start: 0.0, end: 35.0, text: "Biz sebepleri putlastirmayiz." },
      { start: 35.0, end: 70.0, text: "Rezzak olan Allah'tir." },
      { start: 70.0, end: 105.0, text: "Sabah dukkanini acan kul besmeleyle acar." },
      { start: 105.0, end: 140.0, text: "Vesvese bir dumandir, dagilir gider." },
    ];

    // 2. Sliding window chunking (90-120s with ~20% overlap)
    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(0);
    const selectedChunk = chunks[0];
    expect(selectedChunk.duration).toBeGreaterThanOrEqual(90);
    expect(selectedChunk.duration).toBeLessThanOrEqual(120);

    // 3. Audio Cutter creates .ogg libopus 32k file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-e2e-pipeline-"));
    const sourceWav = path.join(tmpDir, "halis_source.wav");
    const outputOgg = path.join(tmpDir, "halis_cut_01.ogg");

    try {
      const wavBuf = createSyntheticWavBuffer(3.0, 16000);
      fs.writeFileSync(sourceWav, wavBuf);

      const pyCut = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip, validate_audio_file

out = cut_audio_clip('${sourceWav}', 0.5, 2.5, '${outputOgg}')
info = validate_audio_file(out)
assert info['codec'] == 'opus'
print("CUT_OK")
`;
      const cutRes = execSync(`${pythonPath} -c "${pyCut.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
      expect(cutRes.trim()).toBe("CUT_OK");

      // 4. Resolve R2 key and public streaming URL
      const r2Key = `halis_aydemir/halis_aydemir_v1_${Math.round(selectedChunk.startSec)}_${Math.round(selectedChunk.endSec)}.ogg`;
      const publicUrl = getPublicAudioUrl(r2Key);
      expect(publicUrl).toContain(r2Key);

      // 5. Query Çelik Kasa Knowledge API and verify audio player can stream
      const req = createMockRequest("http://localhost:3000/api/admin/knowledge?sourceType=HALIS_AYDEMIR");
      const res = await knowledgeHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);

      const activeChunk = json.data[0];
      expect(activeChunk.audioUrl).toMatch(/\.ogg$/);
      expect(activeChunk.startSec).toBeDefined();
      expect(activeChunk.endSec).toBeGreaterThan(activeChunk.startSec);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
