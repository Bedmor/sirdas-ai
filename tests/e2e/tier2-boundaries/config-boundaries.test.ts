import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { describe, it, expect } from "../harness";
import { checkR2Connection, getR2Config } from "@/lib/storage/r2";
import { GET as statsHandler } from "@/app/api/admin/stats/route";

describe("Tier 2: Boundary & Corner Cases — Config & Environment Resiliency", { tier: 2, feature: "Config Boundaries" }, () => {
  const rootDir = process.cwd();
  const pythonPath = "/home/besim/.conda/envs/lyriccat/bin/python";

  it("T2-CFG.1: checkR2Connection returns ok:false with informative message when credentials are missing", async () => {
    const origKey = process.env.R2_ACCESS_KEY_ID;
    const origSecret = process.env.R2_SECRET_ACCESS_KEY;

    try {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      const res = await checkR2Connection();
      expect(res.ok).toBe(false);
      expect(res.message).toContain("not set in environment");
    } finally {
      process.env.R2_ACCESS_KEY_ID = origKey;
      process.env.R2_SECRET_ACCESS_KEY = origSecret;
    }
  });

  it("T2-CFG.2: Admin stats API gracefully falls back to synthetic data if DB is offline or throws error", async () => {
    // Calling stats handler without active live DB
    const res = await statsHandler();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.users.total).toBeGreaterThanOrEqual(0);
    expect(json.data.messages.total).toBeGreaterThanOrEqual(0);
  });

  it("T2-CFG.3: Python config.py detects CUDA availability and configures hardware acceleration device", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
import config

print("DEVICE=" + str(config.DEVICE))
print("CUDA_AVAILABLE=" + str(config.CUDA_AVAILABLE))
batch_sz = getattr(config, "WHISPERX_BATCH_SIZE", getattr(config, "BATCH_SIZE", 16))
print("BATCH_SIZE=" + str(batch_sz))
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res).toContain("DEVICE=cuda");
    expect(res).toContain("CUDA_AVAILABLE=True");
    expect(res).toContain("BATCH_SIZE=16");
  });

  it("T2-CFG.4: R2 public URL builder strips extraneous trailing slashes from configured base URLs", () => {
    const origBase = process.env.R2_PUBLIC_BASE_URL;
    try {
      process.env.R2_PUBLIC_BASE_URL = "https://media.sirdas.ai///";
      const config = getR2Config();
      expect(config.publicBaseUrl).toBe("https://media.sirdas.ai");
    } finally {
      process.env.R2_PUBLIC_BASE_URL = origBase;
    }
  });

  it("T2-CFG.5: Embedder utility handles missing GEMINI_API_KEY gracefully without raising unhandled exceptions", () => {
    const pyScript = `
import sys
sys.path.insert(0, '${path.join(rootDir, "data-pipeline")}')
import config
from utils.embedder import _get_google_embedding

orig_key = config.GEMINI_API_KEY
config.GEMINI_API_KEY = ""
try:
    res = _get_google_embedding("Test metni")
    assert res is None, "Expected None when key is missing"
    print("HANDLED_GRACEFULLY")
finally:
    config.GEMINI_API_KEY = orig_key
`;
    const res = execSync(`${pythonPath} -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
    expect(res.trim()).toBe("HANDLED_GRACEFULLY");
  });
});
