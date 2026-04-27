import { describe, it, expect } from "vitest";
import { StatefulToolUsagePolicyEngine } from "../src/policy/stateful-tool-usage-policy-engine";

describe("StatefulToolUsagePolicyEngine", () => {
  it("should allow tool usage when no usage limits are configured", () => {
    const engine = new StatefulToolUsagePolicyEngine();
    const context = { sessionId: "test-session" };
    const policy = { limitKey: "any_tool:call_count", limit: { maxCalls: 1, windowMs: 1000 } };
    const result = engine.canUseTool(context, policy);
    expect(result).toBe(true);
  });

  it("should block tool usage when the call count exceeds the limit within the time window", () => {
    const engine = new StatefulToolUsagePolicyEngine();
    const context = { sessionId: "test-session" };
    const policy = { limitKey: "tool_a:call_count", limit: { maxCalls: 1, windowMs: 1000 } };

    // First call (should pass)
    let result = engine.canUseTool(context, policy);
    expect(result).toBe(true);

    // Second call immediately after (should fail)
    result = engine.canUseTool(context, policy);
    expect(result).toBe(false);
  });

  it("should allow tool usage again after the time window has passed", () => {
    const engine = new StatefulToolUsagePolicyEngine();
    const context = { sessionId: "test-session" };
    const policy = { limitKey: "tool_b:call_count", limit: { maxCalls: 1, windowMs: 100 } };

    // First call (should pass)
    let result = engine.canUseTool(context, policy);
    expect(result).toBe(true);

    // Simulate time passing (wait longer than windowMs)
    jest.useFakeTimers();
    jest.advanceTimersByTime(150);

    // Second call after time passes (should pass)
    result = engine.canUseTool(context, policy);
    expect(result).toBe(true);
    jest.useRealTimers();
  });
});