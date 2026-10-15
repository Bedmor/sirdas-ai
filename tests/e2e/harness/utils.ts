import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * WCAG 2.1 Relative Luminance & Contrast Calculation
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s = s / 100;
  l = l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return { r: f(0), g: f(8), b: f(4) };
}

export function parseCssColorToRgb(colorStr: string): { r: number; g: number; b: number } {
  if (colorStr.startsWith("#")) {
    return hexToRgb(colorStr);
  }
  // format: "160 84% 20%" or "160, 84%, 20%"
  const parts = colorStr.replace(/%/g, "").split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 3) {
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);
    return hslToRgb(h, s, l);
  }
  throw new Error(`Unable to parse color string: "${colorStr}"`);
}

export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseCssColorToRgb(color1);
  const rgb2 = parseCssColorToRgb(color2);

  const l1 = calculateRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = calculateRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * NextRequest Factory for Next.js App Router API Testing
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    isFormData?: boolean;
  }
): NextRequest {
  const method = options?.method || (options?.body ? "POST" : "GET");
  const headers = new Headers(options?.headers || {});

  let reqInit: RequestInit = {
    method,
    headers,
  };

  if (options?.body) {
    if (options.isFormData) {
      headers.set("content-type", "application/x-www-form-urlencoded");
      const formParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.body)) {
        formParams.append(key, String(val));
      }
      reqInit.body = formParams.toString();
    } else if (typeof options.body === "string") {
      reqInit.body = options.body;
      if (!headers.has("content-type")) {
        headers.set("content-type", "text/plain");
      }
    } else {
      reqInit.body = JSON.stringify(options.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit as any);
}

/**
 * RFC 4180 CSV Parser
 */
export function parseCsv(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split("\n");
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/**
 * Sliding Window Segment Specification Chunker
 * Reference algorithm mirroring Section 5.2.3 & 6 in specifications
 */
export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface AudioChunk {
  startSec: number;
  endSec: number;
  duration: number;
  text: string;
}

export function chunkSegmentsSlidingWindow(
  segments: AudioSegment[],
  targetDurationSec: number = 100,
  minDurationSec: number = 90,
  maxDurationSec: number = 120,
  overlapPct: number = 0.20
): AudioChunk[] {
  if (!segments || segments.length === 0) return [];

  const totalDuration = segments[segments.length - 1].end;
  // If entire audio is shorter than minDurationSec, it forms a single chunk
  if (totalDuration <= maxDurationSec) {
    return [
      {
        startSec: segments[0].start,
        endSec: totalDuration,
        duration: totalDuration - segments[0].start,
        text: segments.map((s) => s.text).join(" "),
      },
    ];
  }

  const chunks: AudioChunk[] = [];
  let currentSegmentIdx = 0;

  while (currentSegmentIdx < segments.length) {
    const chunkStartSec = segments[currentSegmentIdx].start;
    let chunkEndSec = chunkStartSec;
    let chunkTexts: string[] = [];
    let endIdx = currentSegmentIdx;

    while (endIdx < segments.length) {
      const seg = segments[endIdx];
      const proposedDuration = seg.end - chunkStartSec;

      if (proposedDuration > maxDurationSec && chunkTexts.length > 0) {
        break;
      }

      chunkTexts.push(seg.text);
      chunkEndSec = seg.end;
      endIdx++;

      if (proposedDuration >= minDurationSec && proposedDuration <= maxDurationSec) {
        break;
      }
    }

    const duration = chunkEndSec - chunkStartSec;
    chunks.push({
      startSec: Number(chunkStartSec.toFixed(2)),
      endSec: Number(chunkEndSec.toFixed(2)),
      duration: Number(duration.toFixed(2)),
      text: chunkTexts.join(" "),
    });

    if (endIdx >= segments.length) {
      break;
    }

    // Overlap: backtrack ~20% of duration (target ~20s)
    const targetOverlapSec = duration * overlapPct;
    const nextStartTarget = chunkEndSec - targetOverlapSec;

    let backtrackIdx = endIdx - 1;
    while (backtrackIdx > currentSegmentIdx && segments[backtrackIdx].start > nextStartTarget) {
      backtrackIdx--;
    }

    currentSegmentIdx = Math.max(currentSegmentIdx + 1, backtrackIdx);
  }

  return chunks;
}

/**
 * Generate a minimal valid WAV file buffer for FFmpeg tests
 */
export function createSyntheticWavBuffer(durationSec: number = 1, sampleRate: number = 8000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // Format chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // Data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write silent samples (all zero)
  return buffer;
}
