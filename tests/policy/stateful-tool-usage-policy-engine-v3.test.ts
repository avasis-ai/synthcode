import { describe, it, expect } from "vitest";
import {
  PolicyEngineV3,
  AgentContext,
  PolicyResult,
  ToolCall,
} from "../src/policy/stateful-tool-usage-policy-engine-v3";

describe("PolicyEngineV3", () => {
  it("should allow tool usage for a paid user on the first attempt", async () => {
    const context: AgentContext = { userId: "user123", userTier: "paid" };
    const engine = new PolicyEngineV3();
    const result: PolicyResult = await engine.checkToolUsage(
      context,
      "someTool",
      { query: "test" }
    );
    expect(result.action).toBe("ALLOW");
    expect(result.message).toContain("Tool usage allowed");
  });

  it("should deny tool usage for a free user exceeding usage limits", async () => {
    const context: AgentContext = { userId: "user456", userTier: "free" };
    const engine = new PolicyEngineV3();
    // Simulate previous usage to trigger a limit
    (engine as any).simulateUsage(context, "someTool");
    const result: PolicyResult = await engine.checkToolUsage(
      context,
      "someTool",
      { query: "test" }
    );
    expect(result.action).toBe("DENY");
    expect(result.message).toContain("Usage limit exceeded");
  });

  it("should enforce a cooldown period after repeated tool usage", async () => {
    const context: AgentContext = { userId: "user789", userTier: "paid" };
    const engine = new PolicyEngineV3();
    // Simulate first usage
    await engine.checkToolUsage(context, "toolA", {});
    // Simulate second usage immediately (should trigger cooldown if implemented)
    const result: PolicyResult = await engine.checkToolUsage(
      context,
      "toolA",
      {}
    );
    expect(result.action).toBe("COOLDOWN_REQUIRED");
    expect(result.cooldownDurationMs).toBeDefined();
    expect(result.cooldownDurationMs!).toBeGreaterThan(0);
  });
});