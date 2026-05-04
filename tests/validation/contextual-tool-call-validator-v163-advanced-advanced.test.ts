import { describe, it, expect } from "vitest";
import { ContextualRule } from "../src/validation/contextual-tool-call-validator-v163-advanced-advanced";

describe("ContextualRule", () => {
  it("should correctly validate a tool call based on history presence", () => {
    const rule: ContextualRule = {
      condition: ({ history }) => history.some(
        (msg) => msg.type === "tool_use"
      ),
    };

    // Test case where history has a tool use
    const historyWithToolUse: any[] = [
      { type: "user", content: "Initial message" },
      { type: "tool_use", content: "Tool call happened" },
    ];
    expect(rule.condition({ history: historyWithToolUse, currentContext: {} })).toBe(true);

    // Test case where history does not have a tool use
    const historyWithoutToolUse: any[] = [
      { type: "user", content: "Initial message" },
      { type: "assistant", content: "Response" },
    ];
    expect(rule.condition({ history: historyWithoutToolUse, currentContext: {} })).toBe(false);
  });

  it("should correctly validate a tool call based on current context data", () => {
    const rule: ContextualRule = {
      condition: ({ currentContext }) => {
        return currentContext["required_key"] === "expected_value";
      },
    };

    // Test case where context matches
    const contextMatch: Record<string, unknown> = {
      required_key: "expected_value",
      other_key: 123,
    };
    expect(rule.condition({ history: [], currentContext: contextMatch })).toBe(true);

    // Test case where context does not match
    const contextMismatch: Record<string, unknown> = {
      required_key: "wrong_value",
      other_key: 456,
    };
    expect(rule.condition({ history: [], currentContext: contextMismatch })).toBe(false);
  });

  it("should handle failure message when condition fails", () => {
    const failureMessage = "Tool call requires a previous user prompt.";
    const rule: ContextualRule = {
      condition: ({ history }) => history.some(
        (msg) => msg.type === "user"
      ),
      failureMessage: failureMessage,
    };

    // Test case where condition fails
    const historyEmpty: any[] = [];
    const result = rule.condition({ history: historyEmpty, currentContext: {} });
    expect(result).toBe(false); // The condition itself returns boolean, but we test the concept of failure message usage if the validator were to use it.
    // Since the provided structure only defines the condition, we test the condition's output, but confirm the message exists.
    expect(rule.failureMessage).toBe(failureMessage);
  });
});