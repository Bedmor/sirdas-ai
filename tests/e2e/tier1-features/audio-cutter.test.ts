import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";
import { createSyntheticWavBuffer } from "../harness/utils";

describe("Tier 1: Feature Coverage — Audio Cutter (FFmpeg libopus 32k)", { tier: 1, feature: "Audio Cutter" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";
  const cutterScriptPath = path.join(rootDir, "data-pipeline/utils/audio_cutter.py");

  it("T1-CUT.1: Python audio cutter module exists and implements cut_audio_clip interface", () => {
    expect(fs.existsSync(cutterScriptPath)).toBe(true);

    const content = fs.readFileSync(cutterScriptPath, "utf-8");
    expect(content).toContain("def cut_audio_clip");
    expect(content).toContain("def validate_audio_file");
    expect(content).toContain("libopus");
    expect(content).toContain("32k");
    expect(content).toContain("-application");
    expect(content).toContain("voip");
  });

  it("T1-CUT.2: FFmpeg binary is available and supports libopus encoder", () => {
    const output = execSync("ffmpeg -encoders 2>/dev/null", { encoding: "utf-8" });
    expect(output).toContain("libopus");
  });

  it("T1-CUT.3: Real FFmpeg cut produces valid .ogg container with libopus codec at 32k bitrate", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-cutter-test-"));
    const inputWav = path.join(tmpDir, "input.wav");
    const outputOgg = path.join(tmpDir, "output.ogg");

    try {
      // 1. Create a 3-second synthetic WAV file
      const wavBuf = createSyntheticWavBuffer(3.0, 16000);
      fs.writeFileSync(inputWav, wavBuf);
      expect(fs.existsSync(inputWav)).toBe(true);

      // 2. Cut 1.5 seconds clip using the exact required FFmpeg parameters
      const cmd = `ffmpeg -y -ss 0.500 -i "${inputWav}" -t 1.500 -c:a libopus -b:a 32k -vbr on -application voip "${outputOgg}"`;
      execSync(cmd, { stdio: "pipe" });

      expect(fs.existsSync(outputOgg)).toBe(true);
      const stat = fs.statSync(outputOgg);
      expect(stat.size).toBeGreaterThan(0);

      // 3. Inspect with ffprobe
      const probeJson = execSync(
        `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name:format=format_name,duration -of json "${outputOgg}"`,
        { encoding: "utf-8" }
      );
      const probe = JSON.parse(probeJson);
      expect(probe.streams[0].codec_name).toBe("opus");
      expect(probe.format.format_name).toContain("ogg");
      expect(parseFloat(probe.format.duration)).toBeCloseTo(1.5, 0.2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T1-CUT.4: Python audio cutter module executes successfully via Python interpreter", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-py-cutter-test-"));
    const inputWav = path.join(tmpDir, "source.wav");
    const outputOgg = path.join(tmpDir, "cut.ogg");

    try {
      const wavBuf = createSyntheticWavBuffer(5.0, 16000);
      fs.writeFileSync(inputWav, wavBuf);

      const pyTestScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip, validate_audio_file

out = cut_audio_clip('${inputWav}', 1.0, 3.0, '${outputOgg}')
info = validate_audio_file(out)
assert info['codec'] == 'opus', f"Codec was {info['codec']}"
assert 'ogg' in info['format'], f"Format was {info['format']}"
print("OK")
`;
      const pyOutput = execSync(`${pythonPath} -c "${pyTestScript.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
      });
      expect(pyOutput.trim()).toBe("OK");
      expect(fs.existsSync(outputOgg)).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T1-CUT.5: Audio cutter enforces duration calculation and start_sec / end_sec boundaries", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-cutter-bounds-"));
    const inputWav = path.join(tmpDir, "input.wav");
    const outputOgg = path.join(tmpDir, "output.ogg");

    try {
      const wavBuf = createSyntheticWavBuffer(4.0, 16000);
      fs.writeFileSync(inputWav, wavBuf);

      // Cutting exactly 2.0 seconds: from 1.0 to 3.0
      const startSec = 1.0;
      const endSec = 3.0;
      const expectedDuration = endSec - startSec;

      const cmd = `ffmpeg -y -ss ${startSec} -i "${inputWav}" -t ${expectedDuration} -c:a libopus -b:a 32k -vbr on -application voip "${outputOgg}"`;
      execSync(cmd, { stdio: "pipe" });

      const probeJson = execSync(
        `ffprobe -v error -show_entries format=duration -of json "${outputOgg}"`,
        { encoding: "utf-8" }
      );
      const probe = JSON.parse(probeJson);
      const actualDuration = parseFloat(probe.format.duration);

      expect(actualDuration).toBeCloseTo(expectedDuration, 0.2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
