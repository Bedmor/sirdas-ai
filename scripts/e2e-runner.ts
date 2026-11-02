#!/usr/bin/env tsx
/**
 * Sırdaş AI - Comprehensive Opaque-Box E2E Test Runner
 *
 * Runs all 4-Tier E2E test suites:
 *   - Tier 1: Feature Coverage (UI, Donation, Admin, Audio Cutter, R2 Uploader, Text Ingestion, YouTube Chunking)
 *   - Tier 2: Boundary & Corner Cases (Donation, Audio, Chunking, Config, R2 MIME, WCAG AA Contrast)
 *   - Tier 3: Cross-Feature Combinations (Pairwise integration across modules)
 *   - Tier 4: Real-World Application Scenarios (End-to-end user and spiritual guardrail journeys)
 *
 * Usage:
 *   npx tsx scripts/e2e-runner.ts
 *   npx tsx scripts/e2e-runner.ts --tier=1
 *   npx tsx scripts/e2e-runner.ts --grep=PayTR
 */

import { runAllSuites } from "../tests/e2e/harness";
import { TestSuiteResult } from "../tests/e2e/harness/types";

// Import Tier 1 Suites
import "../tests/e2e/tier1-features/ui.test";
import "../tests/e2e/tier1-features/donation.test";
import "../tests/e2e/tier1-features/admin.test";
import "../tests/e2e/tier1-features/audio-cutter.test";
import "../tests/e2e/tier1-features/r2-uploader.test";
import "../tests/e2e/tier1-features/text-ingestion.test";
import "../tests/e2e/tier1-features/youtube-chunking.test";

// Import Tier 2 Suites
import "../tests/e2e/tier2-boundaries/donation-boundaries.test";
import "../tests/e2e/tier2-boundaries/audio-boundaries.test";
import "../tests/e2e/tier2-boundaries/chunking-boundaries.test";
import "../tests/e2e/tier2-boundaries/config-boundaries.test";
import "../tests/e2e/tier2-boundaries/r2-mime-boundaries.test";
import "../tests/e2e/tier2-boundaries/contrast-boundaries.test";

// Import Tier 3 Suites
import "../tests/e2e/tier3-cross-features/donation-flow-to-db.test";
import "../tests/e2e/tier3-cross-features/audio-to-r2-to-supabase.test";
import "../tests/e2e/tier3-cross-features/ui-player-to-audio-url.test";
import "../tests/e2e/tier3-cross-features/text-embedding-to-knowledge.test";
import "../tests/e2e/tier3-cross-features/webhook-to-audit-log.test";

// Import Tier 4 Suites
import "../tests/e2e/tier4-application-scenarios/user-infak-journey.test";
import "../tests/e2e/tier4-application-scenarios/celik-kasa-pipeline-journey.test";
import "../tests/e2e/tier4-application-scenarios/spiritual-safeguards-journey.test";

// Parse CLI Flags
const args = process.argv.slice(2);
let tierFilter: 1 | 2 | 3 | 4 | undefined = undefined;
let grepFilter: string | undefined = undefined;

for (const arg of args) {
  if (arg.startsWith("--tier=")) {
    const t = parseInt(arg.split("=")[1], 10);
    if (t >= 1 && t <= 4) {
      tierFilter = t as 1 | 2 | 3 | 4;
    }
  } else if (arg.startsWith("--grep=")) {
    grepFilter = arg.split("=")[1];
  }
}

async function main() {
  console.log("\n" + "=".repeat(75));
  console.log("       SIRDAŞ AI — COMPREHENSIVE 4-TIER E2E TEST RUNNER");
  console.log("=".repeat(75));
  if (tierFilter) console.log(` [Filter Active] Running only Tier ${tierFilter}`);
  if (grepFilter) console.log(` [Filter Active] Filtering by pattern: "${grepFilter}"`);
  console.log("=".repeat(75) + "\n");

  const startTime = Date.now();
  const results: TestSuiteResult[] = await runAllSuites({
    tier: tierFilter,
    grep: grepFilter,
  });
  const totalDuration = Date.now() - startTime;

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  const tierSummary: Record<number, { passed: number; failed: number; total: number }> = {
    1: { passed: 0, failed: 0, total: 0 },
    2: { passed: 0, failed: 0, total: 0 },
    3: { passed: 0, failed: 0, total: 0 },
    4: { passed: 0, failed: 0, total: 0 },
  };

  for (const suite of results) {
    console.log(`\n📦 ${suite.name} (${suite.durationMs}ms)`);
    for (const c of suite.cases) {
      totalTests++;
      tierSummary[suite.tier].total++;
      if (c.status === "passed") {
        totalPassed++;
        tierSummary[suite.tier].passed++;
        console.log(`  ✅ PASS: ${c.name} (${c.durationMs}ms)`);
      } else if (c.status === "failed") {
        totalFailed++;
        tierSummary[suite.tier].failed++;
        console.error(`  ❌ FAIL: ${c.name} (${c.durationMs}ms)`);
        if (c.error) {
          console.error(`     Error: ${c.error.message}`);
          if (c.error.stack) {
            const stackLines = c.error.stack.split("\n").slice(1, 3).join("\n     ");
            console.error(`     ${stackLines}`);
          }
        }
      } else {
        totalSkipped++;
        console.log(`  ⚪ SKIP: ${c.name}`);
      }
    }
  }

  // Print Summary Table
  console.log("\n" + "=".repeat(75));
  console.log("                       E2E TEST EXECUTION SUMMARY");
  console.log("=".repeat(75));
  console.log(" Tier | Description                       | Passed | Failed | Total");
  console.log("-".repeat(75));
  console.log(`   1  | Feature Coverage (7 Core Domains) | ${String(tierSummary[1].passed).padStart(6)} | ${String(tierSummary[1].failed).padStart(6)} | ${String(tierSummary[1].total).padStart(5)}`);
  console.log(`   2  | Boundary & Corner Cases           | ${String(tierSummary[2].passed).padStart(6)} | ${String(tierSummary[2].failed).padStart(6)} | ${String(tierSummary[2].total).padStart(5)}`);
  console.log(`   3  | Cross-Feature Integrations        | ${String(tierSummary[3].passed).padStart(6)} | ${String(tierSummary[3].failed).padStart(6)} | ${String(tierSummary[3].total).padStart(5)}`);
  console.log(`   4  | Real-World Application Scenarios  | ${String(tierSummary[4].passed).padStart(6)} | ${String(tierSummary[4].failed).padStart(6)} | ${String(tierSummary[4].total).padStart(5)}`);
  console.log("-".repeat(75));
  console.log(` TOTAL RESULTS: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped out of ${totalTests} tests (${(totalDuration / 1000).toFixed(2)}s)`);
  console.log("=".repeat(75) + "\n");

  if (totalFailed > 0) {
    console.error(`🚨 E2E TEST RUNNER DETECTED ${totalFailed} FAILURE(S). Exiting with code 1.\n`);
    process.exit(1);
  } else {
    console.log("🌟 ALL E2E TEST SUITES PASSED FLAWLESSLY (100% SUCCESS). Exiting with code 0.\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal exception in E2E test runner:", err);
  process.exit(1);
});
