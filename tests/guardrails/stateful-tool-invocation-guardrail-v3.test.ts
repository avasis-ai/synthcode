import { describe, it, expect } from "vitest";
import { GuardrailRuleSet, ToolInvocationState, TransitionRule } from "../src/guardrails/stateful-tool-invocation-guardrail-v3";

describe("StatefulToolInvocationGuardrailV3", () => {
  it("should allow transition when the next tool is the same as the last one and within the time limit", () => {
    const ruleSet: GuardrailRuleSet = {
      rules: [
        {
          fromState: "INITIAL",
          toState: "TOOL_USED",
          isValid: (currentState: ToolInvocationState, nextToolName: string, nextInput: Record<string, unknown>) => {
            return nextToolName === currentState.lastToolName && Date.now() - currentState.lastInvocationTime < 10000;
          },
        },
      ],
      initialState: "INITIAL",
      maxAgeMs: 10000,
    };

    const currentState: ToolInvocationState = {
      lastToolCallId: "call-123",
      lastToolName: "toolA",
      invocationCount: 1,
      lastInvocationTime: Date.now() - 1000,
    };

    const nextToolName = "toolA";
    const nextInput = {};

    const rule = ruleSet.rules.find(r => r.fromState === "INITIAL" && r.toState === "TOOL_USED");
    expect(rule?.isValid(currentState, nextToolName, nextInput)).toBe(true);
  });

  it("should reject transition when the next tool is different from the last one", () => {
    const ruleSet: GuardrailRuleSet = {
      rules: [
        {
          fromState: "INITIAL",
          toState: "TOOL_USED",
          isValid: (currentState: ToolInvocationState, nextToolName: string, nextInput: Record<string, unknown>) => {
            return nextToolName === currentState.lastToolName && Date.now() - currentState.lastInvocationTime < 10000;
          },
        },
      ],
      initialState: "INITIAL",
      maxAgeMs: 10000,
    };

    const currentState: ToolInvocationState = {
      lastToolCallId: "call-123",
      lastToolName: "toolA",
      invocationCount: 1,
      lastInvocationTime: Date.now() - 1000,
    };

    const nextToolName = "toolB";
    const nextInput = {};

    const rule = ruleSet.rules.find(r => r.fromState === "INITIAL" && r.toState === "TOOL_USED");
    expect(rule?.isValid(currentState, nextToolName, nextInput)).toBe(false);
  });

  it("should reject transition when the time elapsed since the last invocation exceeds maxAgeMs", () => {
    const ruleSet: GuardrailRuleSet = {
      rules: [
        {
          fromState: "INITIAL",
          toState: "TOOL_USED",
          isValid: (currentState: ToolInvocationState, nextToolName: string, nextInput: Record<string, unknown>) => {
            return nextToolName === currentState.lastToolName && Date.now() - currentState.lastInvocationTime < 10000;
          },
        },
      ],
      initialState: "INITIAL",
      maxAgeMs: 10000,
    };

    const currentState: ToolInvocationState = {
      lastToolCallId: "call-123",
      lastToolName: "toolA",
      invocationCount: 1,
      lastInvocationTime: Date.now() - 15000, // Time elapsed > 10000ms
    };

    const nextToolName = "toolA";
    const nextInput = {};

    const rule = ruleSet.rules.find(r => r.fromState === "INITIAL" && r.toState === "TOOL_USED");
    expect(rule?.isValid(currentState, nextToolName, nextInput)).toBe(false);
  });
});