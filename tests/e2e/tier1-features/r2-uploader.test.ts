import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";
import { getPublicAudioUrl, getR2Config } from "@/lib/storage/r2";

describe("Tier 1: Feature Coverage — Cloudflare R2 Audio Uploader", { tier: 1, feature: "R2 Uploader" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";
  const r2ScriptPath = path.join(rootDir, "data-pipeline/utils/r2_uploader.py");

  it("T1-R2.1: Python R2 uploader module exists and exposes required functions", () => {
    expect(fs.existsSync(r2ScriptPath)).toBe(true);

    const content = fs.readFileSync(r2ScriptPath, "utf-8");
    expect(content).toContain("def upload_audio_to_r2");
    expect(content).toContain("def check_audio_exists_in_r2");
    expect(content).toContain("def delete_audio_from_r2");
    expect(content).toContain('ContentType="audio/ogg"');
  });

  it("T1-R2.2: R2 configuration correctly builds S3-compatible endpoints and bucket bindings", () => {
    const config = getR2Config();
    expect(config.bucketName).toBeDefined();
    expect(config.publicBaseUrl).toBeDefined();
    expect(config.endpoint).toContain("cloudflarestorage.com");
  });

  it("T1-R2.3: Public audio URL generator sanitizes leading slashes and resolves clean media links", () => {
    const url1 = getPublicAudioUrl("halis_aydemir/sohbet_001.ogg");
    const url2 = getPublicAudioUrl("/halis_aydemir/sohbet_001.ogg");

    expect(url1).toContain("halis_aydemir/sohbet_001.ogg");
    expect(url2).toBe(url1);
    expect(url1.startsWith("http")).toBe(true);
  });

  it("T1-R2.4: Python uploader enforces mandatory ContentType: audio/ogg header on S3 PutObject", () => {
    const content = fs.readFileSync(r2ScriptPath, "utf-8");
    // Verifies that put_object call contains ContentType="audio/ogg"
    expect(content).toMatch(/ContentType\s*=\s*["']audio\/ogg["']/);
  });

  it("T1-R2.5: Python uploader validates that source file exists and is non-empty before S3 send", () => {
    const pyTestScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
from utils.r2_uploader import upload_audio_to_r2

try:
    upload_audio_to_r2('/non/existent/path/test.ogg', 'key.ogg')
    print("FAILED_NO_THROW")
except FileNotFoundError:
    print("OK_FILE_NOT_FOUND")
`;
    const pyOutput = execSync(`${pythonPath} -c "${pyTestScript.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
    });
    expect(pyOutput.trim()).toBe("OK_FILE_NOT_FOUND");
  });
});
