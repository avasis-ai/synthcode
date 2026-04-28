import { describe, it, expect } from "vitest";
import { PolicyEngineV2, PolicyRule } from "../src/policy/stateful-tool-usage-policy-engine-v2";

describe("PolicyEngineV2", () => {
  it("should allow tool usage when all metrics are within the defined thresholds", () => {
    const rule: PolicyRule = {
      toolName: "search",
      metrics: { costBudget: 100, callCount: 5, complexityScore: 50 },
      actionThreshold: { cost: 150, calls: 10, complexity: 70 },
      defaultAction: "WARN",
    };
    const engine = new PolicyEngineV2(rule);
    const result = engine.checkUsage({
      toolName: "search",
      currentCost: 10,
      currentCalls: 2,
      currentComplexity: 30,
    });
    expect(result.action).toBe("ALLOW");
  });

  it("should block tool usage when the cost exceeds the defined threshold", () => {
    const rule: PolicyRule = {
      toolName: "api_call",
      metrics: { costBudget: 50, callCount: 10, complexityScore: 100 },
      actionThreshold: { cost: 75, calls: 10, complexity: 100 },
      defaultAction: "WARN",
    };
    const engine = new PolicyEngineV2(rule);
    const result = engine.checkUsage({
      toolName: "api_call",
      currentCost: 80,
      currentCalls: 5,
      currentComplexity: 50,
    });
    expect(result.action).toBe("BLOCK");
  });

  it("should adjust the limit when the call count approaches the threshold", () => {
    const rule: PolicyRule = {
      toolName: "database_query",
      metrics: { costBudget: 200, callCount: 20, complexityScore: 200 },
      actionThreshold: { cost: 300, calls: 25, complexity: 250 },
      defaultAction: "ADJUST_LIMIT",
    };
    const engine = new PolicyEngineV2(rule);
    const result = engine.checkUsage({
      toolName: "database_query",
      currentCost: 50,
      currentCalls: 24,
      currentComplexity: 100,
    });
    expect(result.action).toBe("ADJUST_LIMIT");
  });
});