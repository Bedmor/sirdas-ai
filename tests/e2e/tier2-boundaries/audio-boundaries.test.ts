import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";

describe("Tier 2: Boundary & Corner Cases — Audio Cutter Boundaries", { tier: 2, feature: "Audio Boundaries" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";

  it("T2-AUD.1: Throws FileNotFoundError when source audio file is missing", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip

try:
    cut_audio_clip('/tmp/non_existent_audio_file.wav', 0.0, 5.0, '/tmp/out.ogg')
    print("NO_THROW")
except FileNotFoundError as e:
    print("THREW_FILE_NOT_FOUND")
except Exception as e:
    print(f"THREW_OTHER: {type(e).__name__}")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("THREW_FILE_NOT_FOUND");
  });

  it("T2-AUD.2: Throws ValueError when source audio file is empty (0 bytes)", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-zero-audio-"));
    const emptyFile = path.join(tmpDir, "empty.wav");
    fs.writeFileSync(emptyFile, Buffer.alloc(0));

    try {
      const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import validate_audio_file

try:
    validate_audio_file('${emptyFile}')
    print("NO_THROW")
except ValueError as e:
    print("THREW_VALUE_ERROR")
`;
      const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
      expect(res.trim()).toBe("THREW_VALUE_ERROR");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T2-AUD.3: Throws error when input file is corrupted or not a valid audio container", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-corrupt-audio-"));
    const corruptFile = path.join(tmpDir, "corrupt.ogg");
    fs.writeFileSync(corruptFile, "THIS_IS_NOT_AN_OGG_FILE_CORRUPT_HEADER");

    try {
      const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import validate_audio_file

try:
    validate_audio_file('${corruptFile}')
    print("NO_THROW")
except (RuntimeError, ValueError) as e:
    print("THREW_ERROR")
`;
      const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
      expect(res.trim()).toBe("THREW_ERROR");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T2-AUD.4: Throws ValueError when start_sec is negative (< 0.0)", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip

try:
    # Use existing package.json as dummy existing path
    cut_audio_clip('${path.join(rootDir, "package.json")}', -5.0, 10.0, '/tmp/out.ogg')
    print("NO_THROW")
except ValueError as e:
    if "non-negative" in str(e):
        print("THREW_NEGATIVE_START")
    else:
        print(f"THREW_OTHER_VAL: {e}")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("THREW_NEGATIVE_START");
  });

  it("T2-AUD.5: Throws ValueError when end_sec is less than or equal to start_sec (duration <= 0)", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip

try:
    cut_audio_clip('${path.join(rootDir, "package.json")}', 15.0, 10.0, '/tmp/out.ogg')
    print("NO_THROW")
except ValueError as e:
    if "must be greater than" in str(e):
        print("THREW_INVERTED_DURATION")
    else:
        print(f"THREW_OTHER: {e}")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("THREW_INVERTED_DURATION");
  });

  it("T2-AUD.6: Throws ValueError when output file path lacks mandatory '.ogg' extension", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.audio_cutter import cut_audio_clip

try:
    cut_audio_clip('${path.join(rootDir, "package.json")}', 0.0, 10.0, '/tmp/output.mp3')
    print("NO_THROW")
except ValueError as e:
    if ".ogg" in str(e):
        print("THREW_NON_OGG_EXTENSION")
    else:
        print(f"THREW_OTHER: {e}")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("THREW_NON_OGG_EXTENSION");
  });
});
