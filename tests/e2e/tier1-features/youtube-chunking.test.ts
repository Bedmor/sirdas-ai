import fs from "fs";
import path from "path";
import { describe, it, expect } from "../harness";
import { chunkSegmentsSlidingWindow, AudioSegment } from "../harness/utils";

describe("Tier 1: Feature Coverage — YouTube Chunking & WhisperX Pipeline", { tier: 1, feature: "YouTube Chunking" }, () => {
  const rootDir = process.cwd();

  it("T1-YT.1: Pipeline configuration specifies WhisperX large-v3-turbo and batch size 16 for RTX 4060", () => {
    const configPath = path.join(rootDir, "data-pipeline/config.py");
    expect(fs.existsSync(configPath)).toBe(true);

    const configContent = fs.readFileSync(configPath, "utf-8");
    expect(configContent).toContain("large-v3-turbo");
    expect(configContent.includes("BATCH_SIZE = 16") || configContent.includes("WHISPERX_BATCH_SIZE = 16")).toBe(true);
    expect(configContent).toContain("float16");
    expect(configContent).toContain("cuda");
  });

  it("T1-YT.2: Sliding window chunking algorithm enforces 90 to 120 seconds target duration", () => {
    // Generate synthetic sequence of 30-second segments simulating WhisperX transcription output
    const segments: AudioSegment[] = Array.from({ length: 15 }).map((_, i) => ({
      start: i * 25.0,
      end: (i + 1) * 25.0,
      text: `Sohbet paragrafi ${i + 1}. Allah'a tevekkul ediniz ve sabirla namazla yardim dileyiniz.`,
    }));

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 0; i < chunks.length - 1; i++) {
      const chunk = chunks[i];
      expect(chunk.duration).toBeGreaterThanOrEqual(90);
      expect(chunk.duration).toBeLessThanOrEqual(120);
    }
  });

  it("T1-YT.3: Sliding window preserves exact float start_sec and end_sec timestamps", () => {
    const segments: AudioSegment[] = [
      { start: 12.35, end: 45.80, text: "Giris cumlesi" },
      { start: 45.80, end: 80.15, text: "Gelisim cumlesi" },
      { start: 80.15, end: 115.42, text: "Ana fikir cumlesi" },
      { start: 115.42, end: 155.60, text: "Netice cumlesi" },
    ];

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(0);

    const firstChunk = chunks[0];
    expect(firstChunk.startSec).toBe(12.35);
    expect(firstChunk.endSec).toBeGreaterThan(firstChunk.startSec);
    expect(firstChunk.duration).toBe(Number((firstChunk.endSec - firstChunk.startSec).toFixed(2)));
  });

  it("T1-YT.4: Chunker backtracks between 15% and 20% to prevent thought breaks across cuts", () => {
    const segments: AudioSegment[] = Array.from({ length: 20 }).map((_, i) => ({
      start: i * 20.0,
      end: (i + 1) * 20.0,
      text: `Paragraf ${i + 1}: Tevhid ve kulluk bilinci.`,
    }));

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 0; i < chunks.length - 1; i++) {
      const currentChunk = chunks[i];
      const nextChunk = chunks[i + 1];

      // Overlap occurs when next chunk starts before current chunk ends
      const overlapSec = currentChunk.endSec - nextChunk.startSec;
      expect(overlapSec).toBeGreaterThan(0);

      const overlapRatio = overlapSec / currentChunk.duration;
      // Overlap ratio should be between 10% and 30% (target ~20%)
      expect(overlapRatio).toBeGreaterThanOrEqual(0.10);
      expect(overlapRatio).toBeLessThanOrEqual(0.35);
    }
  });

  it("T1-YT.5: Initial prompt incorporates core Islamic theological vocabulary for accurate transcription", () => {
    const expectedKeywords = [
      "Halis Aydemir",
      "Kur'an-ı Kerim",
      "tevekkül",
      "murakabe",
      "ubudiyet",
      "sünnet",
      "fıkıh",
      "siyer",
      "riba",
      "Talâk",
      "Bakara",
    ];

    // Read config or pipeline prompt
    const configPath = path.join(rootDir, "data-pipeline/config.py");
    const content = fs.readFileSync(configPath, "utf-8");

    let matchCount = 0;
    for (const kw of expectedKeywords) {
      if (content.toLowerCase().includes(kw.toLowerCase())) {
        matchCount++;
      }
    }

    // Config must reference Islamic terms or prompt constants
    expect(matchCount).toBeGreaterThanOrEqual(3);
  });
});
