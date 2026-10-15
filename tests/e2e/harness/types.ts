export type TestStatus = "passed" | "failed" | "skipped";

export interface TestCaseResult {
  name: string;
  status: TestStatus;
  durationMs: number;
  error?: Error;
}

export interface TestSuiteResult {
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
  cases: TestCaseResult[];
  durationMs: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestRunnerOptions {
  tier?: 1 | 2 | 3 | 4;
  grep?: string;
  verbose?: boolean;
}

export type TestFn = () => void | Promise<void>;
