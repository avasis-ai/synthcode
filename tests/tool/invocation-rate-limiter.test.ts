import { describe, it, expect, vi } from "vitest";
import { ToolInvocationRateLimiter } from "../src/tool/invocation-rate-limiter";

describe("ToolInvocationRateLimiter", () => {
  it("should allow invocation up to the limit within the window", async () => {
    const config: Record<string, { limit: number; windowMs: number }> = {
      "toolA": { limit: 2, windowMs: 100 },
    };
    const limiter = new ToolInvocationRateLimiter(config);

    // First call
    await limiter.canInvoke("toolA");
    // Second call
    await limiter.canInvoke("toolA");
    // Third call (should fail)
    await expect(limiter.canInvoke("toolA")).rejects.toThrow("Rate limit exceeded");
  });

  it("should reset the count after the windowMs elapses", async () => {
    const config: Record<string, { limit: number; windowMs: number }> = {
      "toolB": { limit: 1, windowMs: 50 },
    };
    const limiter = new ToolInvocationRateLimiter(config);

    // First call
    await limiter.canInvoke("toolB");
    // Wait for more than the windowMs
    await new Promise(resolve => setTimeout(resolve, 60));
    // Second call (should succeed after reset)
    await expect(limiter.canInvoke("toolB")).resolves.toBe(true);
  });

  it("should handle multiple tools independently", async () => {
    const config: Record<string, { limit: number; windowMs: number }> = {
      "toolC": { limit: 1, windowMs: 100 },
      "toolD": { limit: 2, windowMs: 100 },
    };
    const limiter = new ToolInvocationRateLimiter(config);

    // Tool C call (uses up its limit)
    await limiter.canInvoke("toolC");
    // Tool C second call (should fail)
    await expect(limiter.canInvoke("toolC")).rejects.toThrow("Rate limit exceeded");

    // Tool D call 1 (should pass)
    await expect(limiter.canInvoke("toolD")).resolves.toBe(true);
    // Tool D call 2 (should pass)
    await expect(limiter.canInvoke("toolD")).resolves.toBe(true);
    // Tool D call 3 (should fail)
    await expect(limiter.canInvoke("toolD")).rejects.toThrow("Rate limit exceeded");
  });
});