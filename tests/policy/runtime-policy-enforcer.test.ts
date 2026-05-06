import { describe, it, expect } from "vitest";
import { RuntimePolicyEnforcer } from "../src/policy/runtime-policy-enforcer";

describe("RuntimePolicyEnforcer", () => {
  it("should validate a simple text response action", async () => {
    const enforcer = new RuntimePolicyEnforcer();
    const context = {
      history: [],
      currentStep: "initial",
      state: {},
    };
    const action = {
      type: "text_response",
      details: {
        text: "This is a valid response.",
      },
    };
    const result = await enforcer.enforce(context, action);
    expect(result.isValid).toBe(true);
    expect(result.message).toContain("Text response is valid");
  });

  it("should reject an action that uses an unknown tool", async () => {
    const enforcer = new RuntimePolicyEnforcer();
    const context = {
      history: [],
      currentStep: "tool_use",
      state: {},
    };
    const action = {
      type: "tool_call",
      details: {
        toolName: "unknown_tool",
        arguments: {
          param: "value",
        },
      },
    };
    const result = await enforcer.enforce(context, action);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Unknown tool name");
  });

  it("should reject a sequence action if the first step is invalid", async () => {
    const enforcer = new RuntimePolicyEnforcer();
    const context = {
      history: [],
      currentStep: "sequence",
      state: {},
    };
    const action = {
      type: "sequence",
      details: {
        steps: [
          {
            type: "text_response",
            details: {
              text: "Valid step 1",
            },
          },
          {
            type: "tool_call",
            details: {
              toolName: "nonexistent_tool",
              arguments: {},
            },
          },
        ],
      },
    };
    const result = await enforcer.enforce(context, action);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Sequence validation failed");
  });
});