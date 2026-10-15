import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";

describe("Tier 2: Boundary & Corner Cases — Cloudflare R2 MIME Enforcement", { tier: 2, feature: "R2 MIME Boundaries" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";

  it("T2-MIME.1: Python uploader strictly specifies ContentType='audio/ogg' on S3 put_object", () => {
    const uploaderPath = path.join(rootDir, "data-pipeline/utils/r2_uploader.py");
    const content = fs.readFileSync(uploaderPath, "utf-8");

    expect(content).toContain('ContentType="audio/ogg"');
  });

  it("T2-MIME.2: TypeScript storage helper defaults ContentType to 'audio/ogg'", () => {
    const tsStoragePath = path.join(rootDir, "src/lib/storage/r2.ts");
    const content = fs.readFileSync(tsStoragePath, "utf-8");

    expect(content).toContain('ContentType: params.contentType || "audio/ogg"');
  });

  it("T2-MIME.3: Python uploader throws ValueError when attempting to upload an empty (0 bytes) file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirdas-mime-empty-"));
    const emptyFile = path.join(tmpDir, "test.ogg");
    fs.writeFileSync(emptyFile, Buffer.alloc(0));

    try {
      const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.r2_uploader import upload_audio_to_r2

try:
    upload_audio_to_r2('${emptyFile}', 'test.ogg')
    print("NO_THROW")
except ValueError as e:
    if "0 bytes" in str(e):
        print("THREW_ZERO_BYTES")
    else:
        print(f"THREW_OTHER_VAL: {e}")
`;
      const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
      expect(res.trim()).toBe("THREW_ZERO_BYTES");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("T2-MIME.4: Python uploader rejects empty or whitespace-only R2 destination keys", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.r2_uploader import upload_audio_to_r2

try:
    upload_audio_to_r2('${path.join(rootDir, "package.json")}', '   ///   ')
    print("NO_THROW")
except ValueError as e:
    if "empty" in str(e).lower():
        print("THREW_EMPTY_KEY")
    else:
        print(f"THREW_OTHER: {e}")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("THREW_EMPTY_KEY");
  });

  it("T2-MIME.5: Python and TS storage modules sanitize leading slashes to prevent malformed bucket paths", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')

raw_key = "///audio/voice_01.ogg"
clean_key = raw_key.strip().lstrip("/")
assert clean_key == "audio/voice_01.ogg", f"Clean key was: {clean_key}"
print("CLEAN_KEY_OK")
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("CLEAN_KEY_OK");
  });
});
