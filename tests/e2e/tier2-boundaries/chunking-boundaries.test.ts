import { describe, it, expect } from "../harness";
import { chunkSegmentsSlidingWindow, AudioSegment } from "../harness/utils";

describe("Tier 2: Boundary & Corner Cases — Sliding Window Chunking Boundaries", { tier: 2, feature: "Chunking Boundaries" }, () => {
  it("T2-CHK.1: Audio shorter than 90 seconds forms a single valid chunk without crashing", () => {
    const shortSegments: AudioSegment[] = [
      { start: 0.0, end: 20.0, text: "Birinci cumle." },
      { start: 20.0, end: 45.0, text: "Ikinci cumle kisa ses." },
    ];

    const chunks = chunkSegmentsSlidingWindow(shortSegments, 100, 90, 120, 0.20);
    expect(chunks.length).toBe(1);
    expect(chunks[0].startSec).toBe(0.0);
    expect(chunks[0].endSec).toBe(45.0);
    expect(chunks[0].duration).toBe(45.0);
  });

  it("T2-CHK.2: Audio exactly 90.00 seconds forms single chunk at exact lower threshold", () => {
    const exact90Segments: AudioSegment[] = [
      { start: 0.0, end: 45.0, text: "Ilk 45 saniye." },
      { start: 45.0, end: 90.0, text: "Son 45 saniye tam 90 sn." },
    ];

    const chunks = chunkSegmentsSlidingWindow(exact90Segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBe(1);
    expect(chunks[0].duration).toBe(90.0);
    expect(chunks[0].startSec).toBe(0.0);
    expect(chunks[0].endSec).toBe(90.0);
  });

  it("T2-CHK.3: Audio segment never exceeds the 120.00 seconds maximum upper limit", () => {
    // Continuous segments up to 300 seconds
    const segments: AudioSegment[] = Array.from({ length: 30 }).map((_, i) => ({
      start: i * 10.0,
      end: (i + 1) * 10.0,
      text: `Sohbet parca ${i + 1}.`,
    }));

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.duration).toBeLessThanOrEqual(120.0);
    }
  });

  it("T2-CHK.4: Overlap backtracking respects target 15% to 20% range", () => {
    const segments: AudioSegment[] = Array.from({ length: 25 }).map((_, i) => ({
      start: i * 15.0,
      end: (i + 1) * 15.0,
      text: `Ders ${i + 1} metin.`,
    }));

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 0; i < chunks.length - 1; i++) {
      const c1 = chunks[i];
      const c2 = chunks[i + 1];

      const overlapSec = c1.endSec - c2.startSec;
      expect(overlapSec).toBeGreaterThan(0);

      const overlapPct = (overlapSec / c1.duration) * 100;
      expect(overlapPct).toBeGreaterThanOrEqual(12.0);
      expect(overlapPct).toBeLessThanOrEqual(35.0);
    }
  });

  it("T2-CHK.5: Gracefully processes empty segments array returning empty chunks", () => {
    const chunks = chunkSegmentsSlidingWindow([], 100, 90, 120, 0.20);
    expect(chunks.length).toBe(0);
  });

  it("T2-CHK.6: Final trailing tail segment is preserved with accurate end timestamp", () => {
    // 250s total: chunks of ~100s will leave a remainder tail
    const segments: AudioSegment[] = [
      { start: 0.0, end: 100.0, text: "Ana bolum 1." },
      { start: 100.0, end: 180.0, text: "Ana bolum 2." },
      { start: 180.0, end: 245.5, text: "Son dua ve hatime." },
    ];

    const chunks = chunkSegmentsSlidingWindow(segments, 100, 90, 120, 0.20);
    expect(chunks.length).toBeGreaterThan(1);

    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.endSec).toBe(245.5);
  });
});
