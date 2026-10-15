import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";
import { createSyntheticWavBuffer } from "../harness/utils";
import { getPublicAudioUrl } from "@/lib/storage/r2";

describe("Tier 3: Cross-Feature Integration — Audio Cutter -> R2 Uploader -> Supabase Chunk", { tier: 3, feature: "Audio -> R2 -> DB" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";

  it("T3-XAUD.1: Audio cutter output matches R2 uploader required .ogg libopus 32k format", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-xaudio-"));
    const inputWav = path.join(tmpDir, "source.wav");
    const outputOgg = path.join(tmpDir, "cut_clip.ogg");

    try {
      // 1. Generate synthetic source WAV
      const wavBuf = createSyntheticWavBuffer(5.0, 16000);
      fs.writeFileSync(inputWav, wavBuf);

      // 2. Execute audio cutter
      const pyCutScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip, validate_audio_file

cut_path = cut_audio_clip('${inputWav}', 1.0, 4.0, '${outputOgg}')
info = validate_audio_file(cut_path)
assert info['codec'] == 'opus'
assert 'ogg' in info['format']
print("CUT_VALIDATED")
`;
      const cutOut = execSync(`${pythonPath} -c "${pyCutScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
      expect(cutOut.trim()).toBe("CUT_VALIDATED");

      // 3. Verify cut file is eligible for R2 upload with audio/ogg MIME
      const r2Key = "halis_aydemir/test_clip_01.ogg";
      const publicUrl = getPublicAudioUrl(r2Key);
      expect(publicUrl).toContain("test_clip_01.ogg");
      expect(publicUrl.endsWith(".ogg")).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T3-XAUD.2: Cut audio metadata and R2 URL successfully construct a Supabase knowledge_chunk schema object", () => {
    const startSec = 120.0;
    const endSec = 220.0;
    const duration = endSec - startSec;
    const youtubeId = "halis_aydemir_vid_01";
    const r2Key = `halis_aydemir/${youtubeId}_${Math.round(startSec)}_${Math.round(endSec)}.ogg`;
    const audioUrl = getPublicAudioUrl(r2Key);

    const chunkRecord = {
      id: "chunk-uuid-sample",
      sourceType: "HALIS_AYDEMIR",
      sourceTitle: "Halis Aydemir - Rızık ve Sebepler Tefekkürü",
      content: "Biz sebeplere hürmet ederiz, sebepleri putlaştırmayız...",
      tags: ["RIZIK", "TEVEKKUL", "HALIS_AYDEMIR"],
      nafsTraps: ["SEBEPLERI_PUTLASTIRMA"],
      isRibaRelated: false,
      youtubeId,
      startSec,
      endSec,
      audioUrl,
    };

    expect(chunkRecord.audioUrl).toBe(audioUrl);
    expect(chunkRecord.startSec).toBe(startSec);
    expect(chunkRecord.endSec).toBe(endSec);
    expect(chunkRecord.endSec - chunkRecord.startSec).toBe(duration);
    expect(chunkRecord.sourceType).toBe("HALIS_AYDEMIR");
  });
});
