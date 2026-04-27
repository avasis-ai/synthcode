import { describe, it, expect } from "vitest";
import { PolicyEngine, PolicyRule, PolicyResult } from "../src/policy/tool-usage-policy-engine";

describe("PolicyEngine", () => {
  it("should allow usage when no rules are defined", () => {
    const engine = new PolicyEngine([]);
    const result: PolicyResult = engine.evaluate(
      "some_tool_call",
      [],
      []
    );
    expect(result.isAllowed).toBe(true);
    expect(result.actionTaken).toBe("allow");
  });

  it("should block usage when a matching rule requires it", () => {
    const blockingRule: PolicyRule = {
      id: "block_tool",
      description: "Always block tool usage",
      conditions: [{
        type: "context_match",
        params: {
          context: "any",
        },
      }],
      action: "block",
    };
    const engine = new PolicyEngine([blockingRule]);
    const result: PolicyResult = engine.evaluate(
      "some_tool_call",
      [],
      []
    );
    expect(result.isAllowed).toBe(false);
    expect(result.actionTaken).toBe("block");
  });

  it("should warn when a matching rule suggests caution", () => {
    const warningRule: PolicyRule = {
      id: "warn_tool",
      description: "Warn about tool usage",
      conditions: [{
        type: "context_match",
        params: {
          context: "any",
        },
      }],
      action: "warn",
    };
    const engine = new PolicyEngine([warningRule]);
    const result: PolicyResult = engine.evaluate(
      "some_tool_call",
      [],
      []
    );
    expect(result.isAllowed).toBe(true);
    expect(result.actionTaken).toBe("warn");
  });
});