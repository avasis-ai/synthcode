import { describe, it, expect } from "vitest";
import { ContextualToolCallValidatorV130AdvancedAdvanced } from "../src/validation/contextual-tool-call-validator-v130-advanced-advanced";

describe("ContextualToolCallValidatorV130AdvancedAdvanced", () => {
  it("should return valid when all inputs are correct", () => {
    const context: any = {
      history: [
        { type: "user", content: [{ type: "text", text: "What is the weather?" }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "get_weather", tool_input: { location: "New York" } } }]
      ],
      metadata: { user_id: "user123" },
      toolCall: {
        name: "get_weather",
        input: { location: "New York" },
      },
    };
    const validator = new ContextualToolCallValidatorV130AdvancedAdvanced();
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors when toolCall name is missing", () => {
    const context: any = {
      history: [
        { type: "user", content: [{ type: "text", text: "What is the weather?" }] }
      ],
      metadata: { user_id: "user123" },
      toolCall: {
        name: "",
        input: { location: "New York" },
      },
    };
    const validator = new ContextualToolCallValidatorV130AdvancedAdvanced();
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call name cannot be empty.");
  });

  it("should return invalid with errors when toolCall input is missing", () => {
    const context: any = {
      history: [
        { type: "user", content: [{ type: "text", text: "What is the weather?" }] }
      ],
      metadata: { user_id: "user123" },
      toolCall: {
        name: "get_weather",
        input: {},
      },
    };
    const validator = new ContextualToolCallValidatorV130AdvancedAdvanced();
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call input cannot be empty.");
  });
});