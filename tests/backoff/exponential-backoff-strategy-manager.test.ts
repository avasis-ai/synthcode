import { describe, it, expect, vi } from "vitest";
import { ExponentialBackoffStrategyManager } from "../src/backoff/exponential-backoff-strategy-manager";

describe("ExponentialBackoffStrategyManager", () => {
  it("should calculate the initial delay correctly for the first attempt", () => {
    const config = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      jitterFactor: 0.1,
    };
    // Attempt 1 (index 0) should use initialDelayMs
    const delay = ExponentialBackoffStrategyManager.calculateDelay(0, config);
    expect(delay).toBeCloseTo(100);
  });

  it("should calculate increasing delays for subsequent attempts", () => {
    const config = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      jitterFactor: 0.1,
    };
    // Attempt 2 (index 1): 100 * 2^1 = 200
    const delayAttempt2 = ExponentialBackoffStrategyManager.calculateDelay(1, config);
    expect(delayAttempt2).toBeCloseTo(200);

    // Attempt 3 (index 2): 100 * 2^2 = 400
    const delayAttempt3 = ExponentialBackoffStrategyManager.calculateDelay(2, config);
    expect(delayAttempt3).toBeCloseTo(400);
  });

  it("should cap the calculated delay at maxDelayMs", () => {
    const config = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 500,
      jitterFactor: 0.1,
    };
    // Attempt 5 (index 4): 100 * 2^4 = 1600. Should be capped at 500.
    const delayAttempt5 = ExponentialBackoffStrategyManager.calculateDelay(4, config);
    expect(delayAttempt5).toBe(500);
  });
});