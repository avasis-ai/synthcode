import { describe, it, expect } from "vitest";
import { ContextualConstraintValidator, ContextPayload, ConstraintRule } from "../src/validation/contextual-constraint-validator";

describe("ContextualConstraintValidator", () => {
  it("should validate correctly when all constraints pass", () => {
    const validator = new ContextualConstraintValidator();
    const context: ContextPayload = {
      messages: [{ role: "user", content: "Hello" }],
      history: [],
      metadata: { userType: "premium" },
    };
    const rules: ConstraintRule[] = [
      { name: "checkUserType", validate: (context) => {
        if (context.metadata["userType"] === "premium") return null;
        return "User must be premium";
      }},
      { name: "checkMessageLength", validate: (context) => {
        if (context.messages.length > 0 && context.messages[0].content.length > 5) return null;
        return "Message too short";
      }},
    ];

    const result = validator.validate(context, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should collect all errors when multiple constraints fail", () => {
    const validator = new ContextualConstraintValidator();
    const context: ContextPayload = {
      messages: [{ role: "user", content: "Hi" }],
      history: [],
      metadata: { userType: "basic" },
    };
    const rules: ConstraintRule[] = [
      { name: "checkUserType", validate: (context) => {
        if (context.metadata["userType"] === "premium") return null;
        return "User must be premium";
      }},
      { name: "checkMessageLength", validate: (context) => {
        if (context.messages.length > 0 && context.messages[0].content.length > 5) return null;
        return "Message too short";
      }},
    ];

    const result = validator.validate(context, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining(["User must be premium", "Message too short"]));
  });

  it("should return valid if no rules are provided", () => {
    const validator = new ContextualConstraintValidator();
    const context: ContextPayload = {
      messages: [],
      history: [],
      metadata: {},
    };
    const rules: ConstraintRule[] = [];

    const result = validator.validate(context, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});