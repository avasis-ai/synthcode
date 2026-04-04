import { describe, it, expect, vi } from "vitest";
import { RetryPolicyEngine, RetryConfig } from "../src/retry/tool-invocation-retry-policy";

describe("RetryPolicyEngine", () => {
  it("should execute the function successfully on the first attempt", async () => {
    const mockFn = vi.fn(() => Promise.resolve("success"));
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 10,
      backoffFactor: 2,
    };
    const engine = new RetryPolicyEngine<string>(config);

    const result = await engine.execute(mockFn, config);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result).toBe("success");
  });

  it("should retry with exponential backoff on failure until max attempts are reached", async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error("Failed attempt 1"))
      .mockRejectedValueOnce(new Error("Failed attempt 2"))
      .mockResolvedValue("success"); // Succeeds on 3rd attempt

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 10,
      backoffFactor: 2,
    };
    const engine = new RetryPolicyEngine<string>(config);

    // Mock setTimeout to avoid actual delays and test logic flow
    vi.useFakeTimers();

    const promise = engine.execute(mockFn, config);

    // Advance time for the first two retries
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);

    const result = await promise;

    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(result).toBe("success");

    vi.useRealTimers();
  });

  it("should throw the error if all attempts fail", async () => {
    const mockFn = vi.fn(() => Promise.reject(new Error("Permanent failure")));
    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 10,
      backoffFactor: 2,
    };
    const engine = new RetryPolicyEngine<string>(config);

    vi.useFakeTimers();

    await expect(engine.execute(mockFn, config)).rejects.toThrow("Permanent failure");

    expect(mockFn).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});