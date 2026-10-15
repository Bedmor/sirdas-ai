import { TestCaseResult, TestSuiteResult, TestFn } from "./types";

interface SuiteContext {
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
  tests: { name: string; fn: TestFn }[];
  beforeEachHooks: (() => void | Promise<void>)[];
  afterEachHooks: (() => void | Promise<void>)[];
}

let currentSuite: SuiteContext | null = null;
const allSuites: SuiteContext[] = [];

export function describe(
  name: string,
  meta: { tier: 1 | 2 | 3 | 4; feature?: string },
  fn: () => void
): void {
  const suite: SuiteContext = {
    name,
    tier: meta.tier,
    feature: meta.feature,
    tests: [],
    beforeEachHooks: [],
    afterEachHooks: [],
  };

  const prevSuite = currentSuite;
  currentSuite = suite;
  allSuites.push(suite);

  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function it(name: string, fn: TestFn): void {
  if (!currentSuite) {
    throw new Error(`Test '${name}' must be defined inside a describe() block`);
  }
  currentSuite.tests.push({ name, fn });
}

export function beforeEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error("beforeEach must be defined inside a describe() block");
  }
  currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error("afterEach must be defined inside a describe() block");
  }
  currentSuite.afterEachHooks.push(fn);
}

export class ExpectationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpectationError";
  }
}

export function expect<T = any>(actual: T) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new ExpectationError(
          `Expected ${JSON.stringify(expected)} (type ${typeof expected}), but received ${JSON.stringify(actual)} (type ${typeof actual})`
        );
      }
    },
    toEqual(expected: any) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new ExpectationError(
          `Expected deep equality:\nExpected: ${e}\nReceived: ${a}`
        );
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new ExpectationError(`Expected truthy value, received: ${String(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new ExpectationError(`Expected falsy value, received: ${String(actual)}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new ExpectationError("Expected value to be defined, but was undefined");
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new ExpectationError(`Expected null, but received: ${String(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new ExpectationError(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual < expected) {
        throw new ExpectationError(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== "number" || actual >= expected) {
        throw new ExpectationError(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual > expected) {
        throw new ExpectationError(`Expected ${actual} to be <= ${expected}`);
      }
    },
    toBeCloseTo(expected: number, delta: number = 0.01) {
      if (typeof actual !== "number" || Math.abs(actual - expected) > delta) {
        throw new ExpectationError(
          `Expected ${actual} to be close to ${expected} within delta ${delta}`
        );
      }
    },
    toContain(expected: string | any) {
      if (typeof actual === "string" && typeof expected === "string") {
        if (!actual.includes(expected)) {
          throw new ExpectationError(
            `Expected string to contain "${expected}", but received:\n${actual.slice(0, 300)}`
          );
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new ExpectationError(
            `Expected array to contain item ${JSON.stringify(expected)}`
          );
        }
      } else {
        throw new ExpectationError(`toContain cannot be used on actual of type ${typeof actual}`);
      }
    },
    toMatch(regex: RegExp) {
      if (typeof actual !== "string" || !regex.test(actual)) {
        throw new ExpectationError(
          `Expected "${String(actual)}" to match regular expression ${regex}`
        );
      }
    },
    toThrow(pattern?: string | RegExp) {
      if (typeof actual !== "function") {
        throw new ExpectationError("Expected a function to test for throwing");
      }
      let didThrow = false;
      let thrownError: any = null;
      try {
        (actual as any)();
      } catch (err) {
        didThrow = true;
        thrownError = err;
      }
      if (!didThrow) {
        throw new ExpectationError("Expected function to throw, but it did not throw");
      }
      if (pattern) {
        const msg = thrownError?.message || String(thrownError);
        if (typeof pattern === "string" && !msg.includes(pattern)) {
          throw new ExpectationError(
            `Expected thrown error to contain "${pattern}", but got: "${msg}"`
          );
        }
        if (pattern instanceof RegExp && !pattern.test(msg)) {
          throw new ExpectationError(
            `Expected thrown error to match ${pattern}, but got: "${msg}"`
          );
        }
      }
    },
    rejects: {
      async toThrow(pattern?: string | RegExp) {
        if (!(actual instanceof Promise)) {
          throw new ExpectationError("Expected a Promise for rejects matcher");
        }
        let didThrow = false;
        let thrownError: any = null;
        try {
          await actual;
        } catch (err) {
          didThrow = true;
          thrownError = err;
        }
        if (!didThrow) {
          throw new ExpectationError("Expected promise to reject, but it resolved");
        }
        if (pattern) {
          const msg = thrownError?.message || String(thrownError);
          if (typeof pattern === "string" && !msg.includes(pattern)) {
            throw new ExpectationError(
              `Expected rejection to contain "${pattern}", but got: "${msg}"`
            );
          }
          if (pattern instanceof RegExp && !pattern.test(msg)) {
            throw new ExpectationError(
              `Expected rejection to match ${pattern}, but got: "${msg}"`
            );
          }
        }
      },
    },
  };
}

export async function runAllSuites(filter?: {
  tier?: 1 | 2 | 3 | 4;
  grep?: string;
}): Promise<TestSuiteResult[]> {
  const results: TestSuiteResult[] = [];

  for (const suite of allSuites) {
    if (filter?.tier && suite.tier !== filter.tier) {
      continue;
    }

    const suiteStart = Date.now();
    const suiteResult: TestSuiteResult = {
      name: suite.name,
      tier: suite.tier,
      feature: suite.feature,
      cases: [],
      durationMs: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    };

    for (const test of suite.tests) {
      if (filter?.grep && !test.name.toLowerCase().includes(filter.grep.toLowerCase())) {
        suiteResult.cases.push({
          name: test.name,
          status: "skipped",
          durationMs: 0,
        });
        suiteResult.skipped++;
        continue;
      }

      const testStart = Date.now();
      try {
        for (const hook of suite.beforeEachHooks) {
          await hook();
        }
        await test.fn();
        for (const hook of suite.afterEachHooks) {
          await hook();
        }

        const duration = Date.now() - testStart;
        suiteResult.cases.push({
          name: test.name,
          status: "passed",
          durationMs: duration,
        });
        suiteResult.passed++;
      } catch (err: any) {
        const duration = Date.now() - testStart;
        suiteResult.cases.push({
          name: test.name,
          status: "failed",
          durationMs: duration,
          error: err instanceof Error ? err : new Error(String(err)),
        });
        suiteResult.failed++;
      }
    }

    suiteResult.durationMs = Date.now() - suiteStart;
    results.push(suiteResult);
  }

  return results;
}

export function clearSuites() {
  allSuites.length = 0;
}
