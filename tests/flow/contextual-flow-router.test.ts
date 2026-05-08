import { describe, it, expect } from "vitest";
import { ContextualFlowRouter, FlowRule, Operator } from "../src/flow/contextual-flow-router";

describe("ContextualFlowRouter", () => {
  it("should return the next action of the highest weighted rule that matches the context", () => {
    const rules: FlowRule[] = [
      {
        name: "RuleA",
        weight: 10,
        criteria: {
          contextKey: "userType",
          operator: "equals" as Operator,
          threshold: "premium",
        },
        nextAction: {
          type: "tool_id" as const,
          value: "premium_tool",
        },
      },
      {
        name: "RuleB",
        weight: 5,
        criteria: {
          contextKey: "userType",
          operator: "equals" as Operator,
          threshold: "basic",
        },
        nextAction: {
          type: "module_name" as const,
          value: "basic_module",
        },
      },
      {
        name: "RuleC",
        weight: 15,
        criteria: {
          contextKey: "userType",
          operator: "equals" as Operator,
          threshold: "premium",
        },
        nextAction: {
          type: "tool_id" as const,
          value: "super_premium_tool",
        },
      },
    ];

    const router = new ContextualFlowRouter(rules);
    const context = { userType: "premium" };

    // RuleC (weight 15) should override RuleA (weight 10)
    const nextAction = router.route(context);

    expect(nextAction).toEqual({
      type: "tool_id" as const,
      value: "super_premium_tool",
    });
  });

  it("should return null if no rules match the given context", () => {
    const rules: FlowRule[] = [
      {
        name: "RuleA",
        weight: 10,
        criteria: {
          contextKey: "userType",
          operator: "equals" as Operator,
          threshold: "premium",
        },
        nextAction: {
          type: "tool_id" as const,
          value: "premium_tool",
        },
      },
      {
        name: "RuleB",
        weight: 5,
        criteria: {
          contextKey: "userType",
          operator: "equals" as Operator,
          threshold: "basic",
        },
        nextAction: {
          type: "module_name" as const,
          value: "basic_module",
        },
      },
    ];

    const router = new ContextualFlowRouter(rules);
    const context = { userType: "guest" }; // No matching rule

    const nextAction = router.route(context);

    expect(nextAction).toBeNull();
  });

  it("should handle multiple matching rules and prioritize based on weight", () => {
    const rules: FlowRule[] = [
      {
        name: "RuleLowWeight",
        weight: 1,
        criteria: {
          contextKey: "status",
          operator: "contains" as Operator,
          threshold: "error",
        },
        nextAction: {
          type: "tool_id" as const,
          value: "error_tool",
        },
      },
      {
        name: "RuleHighWeight",
        weight: 100,
        criteria: {
          contextKey: "status",
          operator: "contains" as Operator,
          threshold: "error",
        },
        nextAction: {
          type: "module_name" as const,
          value: "critical_error_module",
        },
      },
      {
        name: "RuleMediumWeight",
        weight: 50,
        criteria: {
          contextKey: "status",
          operator: "contains" as Operator,
          threshold: "error",
        },
        nextAction: {
          type: "tool_id" as const,
          value: "medium_error_tool",
        },
      },
    ];

    const router = new ContextualFlowRouter(rules);
    const context = { status: "system error occurred" };

    const nextAction = router.route(context);

    expect(nextAction).toEqual({
      type: "module_name" as const,
      value: "critical_error_module",
    });
  });
});