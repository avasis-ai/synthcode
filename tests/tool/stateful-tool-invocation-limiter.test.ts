import { describe, it, expect, vi } from "vitest";
import { StatefulToolInvocationLimiter } from "../src/tool/stateful-tool-invocation-limiter";

describe("StatefulToolInvocationLimiter", () => {
  it("should allow initial calls up to the configured limit within the window", async () => {
    const limiter = new StatefulToolInvocationLimiter({
      toolLimits: new Map([
        ["toolA", { maxCalls: 3, windowMs: 1000 }],
      ]),
    });

    const context = { sessionId: "session1" };

    // Test calls within the limit
    let allowedCount = 0;
    for (let i = 1; i <= 3; i++) {
      const allowed = await limiter.isAllowed("toolA", context);
      expect(allowed).toBe(true);
      allowedCount++;
    }
    expect(allowedCount).toBe(3);

    // Test call exceeding the limit immediately
    const exceeded = await limiter.isAllowed("toolA", context);
    expect(exceeded).toBe(false);
  });

  it("should reset the count and allow calls after the window expires", async () => {
    const limiter = new StatefulToolInvocationLimiter({
      toolLimits: new Map([
        ["toolB", { maxCalls: 2, windowMs: 50 }],
      ]),
    });

    const context = { sessionId: "session2" };

    // 1. Make calls to exhaust the limit
    await limiter.isAllowed("toolB", context);
    await limiter.isAllowed("toolB", context);
    
    // 2. Check that the next call is blocked
    let isBlocked = await limiter.isAllowed("toolB", context);
    expect(isBlocked).toBe(false);

    // 3. Wait for the window to pass (slightly more than windowMs)
    await new Promise(resolve => setTimeout(resolve, 60));

    // 4. Check that the next call is allowed again
    const isAllowedAfterWait = await limiter.isAllowed("toolB", context);
    expect(isAllowedAfterWait).toBe(true);
  });

  it("should handle different tools and sessions independently", async () => {
    const limiter = new StatefulToolInvocationLimiter({
      toolLimits: new Map([
        ["toolX", { maxCalls: 1, windowMs: 100 }],
        ["toolY", { maxCalls: 1, windowMs: 100 }],
      ]),
    });

    const context1 = { sessionId: "sessionA" };
    const context2 = { sessionId: "sessionB" };

    // Tool X for Session A (Should succeed)
    let allowedX = await limiter.isAllowed("toolX", context1);
    expect(allowedX).toBe(true);

    // Tool X for Session A (Should fail immediately)
    let failedX = await limiter.isAllowed("toolX", context1);
    expect(failedX).toBe(false);

    // Tool Y for Session A (Should succeed independently)
    let allowedY = await limiter.isAllowed("toolY", context1);
    expect(allowedY).toBe(true);

    // Tool X for Session B (Should succeed independently of Session A's usage)
    let allowedX_B = await limiter.isAllowed("toolX", context2);
    expect(allowedX_B).toBe(true);
  });
});