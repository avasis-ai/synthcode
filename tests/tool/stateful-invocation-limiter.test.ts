import { describe, it, expect } from "vitest";
import { ToolInvocationLimiter } from "../src/tool/stateful-invocation-limiter";

describe("ToolInvocationLimiter", () => {
  it("should allow initial calls up to the global limit", () => {
    const config = {
      globalMaxCalls: 3,
      globalWindowMs: 1000,
      toolSpecificLimits: {
        "toolA": { maxCalls: 5, windowMs: 5000 },
      },
    };
    const limiter = new ToolInvocationLimiter(config);

    // Simulate 3 calls within the window
    for (let i = 1; i <= 3; i++) {
      expect(limiter.canInvoke("toolA", "context1")).toBe(true);
    }

    // The 4th call should fail if the window hasn't passed
    expect(limiter.canInvoke("toolA", "context1")).toBe(false);
  });

  it("should respect tool-specific limits independently of global limits", () => {
    const config = {
      globalMaxCalls: 10,
      globalWindowMs: 10000,
      toolSpecificLimits: {
        "toolB": { maxCalls: 2, windowMs: 500 },
      },
    };
    const limiter = new ToolInvocationLimiter(config);

    // Tool B should fail after 2 calls, even if global limit isn't hit
    expect(limiter.canInvoke("toolB", "context2")).toBe(true);
    expect(limiter.canInvoke("toolB", "context2")).toBe(true);
    expect(limiter.canInvoke("toolB", "context2")).toBe(false);
  });

  it("should allow invocation after the specified window time passes", async () => {
    const config = {
      globalMaxCalls: 5,
      globalWindowMs: 100,
      toolSpecificLimits: {
        "toolC": { maxCalls: 1, windowMs: 50 },
      },
    };
    const limiter = new ToolInvocationLimiter(config);

    // First call
    expect(limiter.canInvoke("toolC", "context3")).toBe(true);

    // Wait for the window to pass
    await new Promise(resolve => setTimeout(resolve, 60));

    // Second call should now be allowed
    expect(limiter.canInvoke("toolC", "context3")).toBe(true);
  });
});