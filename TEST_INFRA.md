# Sırdaş AI — E2E Test Infrastructure & Verification Architecture

## 1. Test Philosophy & Architecture

Sırdaş AI implements a comprehensive **4-Tier Opaque-Box E2E Testing Architecture** designed to verify behavioral correctness, boundary safety, cross-module interoperability, and real-world operational user journeys across both the Next.js 15 Web/Admin Application and the Phase 2 RTX 4060 Python Data Pipeline.

The test harness enforces:
- **Opaque-Box Verification:** Tests interface contracts, public API routes, DOM structures, and mathematical formulas rather than internal implementation hacks.
- **Zero-Regression Resilience:** Guarantees exit code 0 when all tests pass, and non-zero (exit code 1) upon any failure.
- **Dual Runtime Integration:** Seamlessly orchestrates TypeScript/Next.js evaluations and native Python 3.10+ / PyTorch / CUDA / FFmpeg execution within the test runner.

---

## 2. 4-Tier Test Hierarchy & Feature Inventory

```
tests/e2e/
├── harness/
│   ├── index.ts                     # Test execution engine (describe, it, expect, matchers, runner)
│   ├── types.ts                     # Type definitions for suites, results, assertions
│   └── utils.ts                     # WCAG contrast calculator, NextRequest mock, synthetic WAV generator, sliding window chunker
├── tier1-features/
│   ├── ui.test.ts                   # T1-UI: Islamic theme tokens, Hero, wa.me CTA, 5 Spiritual Filters, Siyer Mührü (6 tests)
│   ├── donation.test.ts             # T1-DON: Pool counter, preset tiers, custom calculation, checkout API, IPN verification (6 tests)
│   ├── admin.test.ts                # T1-ADM: Stats KPIs, RFC 4180 CSV export, JSON export, Çelik Kasa browser, audit logs (6 tests)
│   ├── audio-cutter.test.ts         # T1-CUT: FFmpeg libopus 32k VBR voip profile, .ogg container format, Python cutter (5 tests)
│   ├── r2-uploader.test.ts          # T1-R2: Cloudflare R2 S3 SDK, ContentType: audio/ogg, URL builders, validation (5 tests)
│   ├── text-ingestion.test.ts       # T1-TXT: Semantic Quran/Hadith passages, Bakara 275-279 riba package, 768d embeddings (5 tests)
│   └── youtube-chunking.test.ts     # T1-YT: Sliding window 90-120s, 15-20% overlap, timestamp preservation, Islamic prompt (5 tests)
├── tier2-boundaries/
│   ├── donation-boundaries.test.ts  # T2-DON: Zero/negative amount, 100k upper bound, non-numeric strings, 0.01 fraction, hash tampering (6 tests)
│   ├── audio-boundaries.test.ts     # T2-AUD: Missing file, 0-byte file, corrupt file, negative start, inverted duration, non-.ogg (6 tests)
│   ├── chunking-boundaries.test.ts  # T2-CHK: Short segment <90s, exact 90s, exact 120s max, backtrack overlap %, empty segments (6 tests)
│   ├── config-boundaries.test.ts    # T2-CFG: Missing R2 keys, offline DB fallback, CUDA detection, URL slash stripping (5 tests)
│   ├── r2-mime-boundaries.test.ts   # T2-MIME: Strict audio/ogg enforcement, empty key rejection, leading slash sanitization (5 tests)
│   └── contrast-boundaries.test.ts  # T2-CON: WCAG AA contrast ratios (emerald/gold/charcoal), luminance formula, large text threshold (6 tests)
├── tier3-cross-features/
│   ├── donation-flow-to-db.test.ts  # T3-XDON: Checkout init -> PayTR IPN webhook -> DB update -> Pool KPI increment (2 tests)
│   ├── audio-to-r2-to-supabase.test.ts # T3-XAUD: Audio cut (.ogg) -> R2 S3 put (audio/ogg) -> Supabase knowledge_chunk schema (2 tests)
│   ├── ui-player-to-audio-url.test.ts # T3-XPLY: Knowledge API -> audioUrl -> Çelik Kasa audio player controls & timestamps (2 tests)
│   ├── text-embedding-to-knowledge.test.ts # T3-XEMB: Text passage -> 768d embedding -> pgvector HNSW index & Bakara priority (2 tests)
│   └── webhook-to-audit-log.test.ts # T3-XAUD: WhatsApp query -> Jev metadata -> Gemini editor_audit -> Admin audit log (2 tests)
└── tier4-application-scenarios/
    ├── user-infak-journey.test.ts   # T4-SCN: Complete user infak journey: Selection -> Checkout -> IPN -> Success redirect (2 tests)
    ├── celik-kasa-pipeline-journey.test.ts # T4-SCN: Full audio pipeline: Chunks -> FFmpeg cut -> R2 upload -> Admin playback (1 test)
    ├── admin-vas-reconciliation-journey.test.ts # T4-SCN: GSM VAS operator reconciliation: Telemetry -> Daily aggregation -> CSV export (1 test)
    └── spiritual-safeguards-journey.test.ts # T4-SCN: Fatwa bypass (Alo 190) -> Riba shield (Bakara 275-279) -> Crisis care (112/182) (3 tests)
```

---

## 3. Test Runner Commands

The unified test runner is implemented in `scripts/e2e-runner.ts` and can be invoked directly:

### 3.1. Complete E2E Suite Execution
Runs all 89 test cases across all 4 tiers:
```bash
npx tsx scripts/e2e-runner.ts
```

### 3.2. Tier-Filtered Execution
Run only a specific tier:
```bash
npx tsx scripts/e2e-runner.ts --tier=1    # Feature Coverage (38 tests)
npx tsx scripts/e2e-runner.ts --tier=2    # Boundary & Corner Cases (34 tests)
npx tsx scripts/e2e-runner.ts --tier=3    # Cross-Feature Integrations (10 tests)
npx tsx scripts/e2e-runner.ts --tier=4    # Real-World Application Scenarios (7 tests)
```

### 3.3. Pattern / Keyword Grep Filtering
Run specific tests matching a keyword:
```bash
npx tsx scripts/e2e-runner.ts --grep="PayTR"
npx tsx scripts/e2e-runner.ts --grep="Audio Cutter"
npx tsx scripts/e2e-runner.ts --grep="Bakara"
```

---

## 4. Coverage Thresholds & Verified Metrics

| Tier | Domain | Minimum Required | Implemented & Passing | Pass Rate | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Tier 1** | Feature Coverage (7 core domains) | $\ge 5$ per feature ($\ge 35$ total) | **38 tests** | **100%** | ✅ PASS |
| **Tier 2** | Boundary & Corner Cases (6 domains) | $\ge 5$ per domain ($\ge 30$ total) | **34 tests** | **100%** | ✅ PASS |
| **Tier 3** | Cross-Feature Pairwise Integrations | $\ge 2$ per integration ($\ge 8$ total) | **10 tests** | **100%** | ✅ PASS |
| **Tier 4** | Real-World Application Scenarios | $\ge 1$ per journey ($\ge 4$ total) | **7 tests** | **100%** | ✅ PASS |
| **TOTAL** | **Comprehensive Full Suite** | $\ge 77$ tests | **89 tests** | **100%** | ✅ PASS |

---

## 5. Verification Checklist

- [x] Full E2E test runner exits with code 0 (`npx tsx scripts/e2e-runner.ts`).
- [x] Zero lint warnings/errors (`npm run lint`).
- [x] Zero TypeScript compilation errors (`npm run typecheck`).
- [x] Real FFmpeg `.ogg` libopus 32k voice cutting verified.
- [x] Real Cloudflare R2 MIME header `ContentType: audio/ogg` verified.
- [x] Sliding window temporal chunking (90-120s with 15-20% overlap) mathematically verified.
- [x] WCAG AA relative luminance and contrast ratios verified.
