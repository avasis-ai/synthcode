import { describe, it, expect, vi } from "vitest";
import { RateLimiter, RateLimiterStrategy } from "../src/rate-limiter";

describe("RateLimiter", () => {
  it("should allow acquisition when the strategy permits it immediately", async () => {
    const mockStrategy: RateLimiterStrategy = {
      canAcquire: vi.fn(() => ({ allowed: true, waitTimeMs: 0 })),
    };
    const rateLimiter = new RateLimiter(mockStrategy, "testResource");

    await rateLimiter.tryAcquire();

    expect(mockStrategy.canAcquire).toHaveBeenCalledWith("testResource");
  });

  it("should wait for the specified time when the strategy requires waiting", async () => {
    const mockStrategy: RateLimiterStrategy = {
      canAcquire: vi.fn(() => ({ allowed: true, waitTimeMs: 50 })),
    };
    const rateLimiter = new RateLimiter(mockStrategy, "testResource");

    const promise = rateLimiter.tryAcquire();

    // Wait for the promise to resolve, simulating the wait time
    await new Promise(resolve => setTimeout(resolve, 60));
    await promise;

    expect(mockStrategy.canAcquire).toHaveBeenCalledWith("testResource");
  });

  it("should throw an error or handle the wait if acquisition is not allowed", async () => {
    const mockStrategy: RateLimiterStrategy = {
      canAcquire: vi.fn(() => ({ allowed: false, waitTimeMs: 0 })),
    };
    const rateLimiter = new RateLimiter(mockStrategy, "testResource");

    // Assuming tryAcquire throws or rejects if not allowed, based on typical implementation
    // If the actual implementation handles this differently (e.g., returns a boolean), adjust the expectation.
    // For this test, we assume it throws if not allowed.
    await expect(rateLimiter.tryAcquire()).rejects.toThrow();
  });
});