import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator";

describe("ContextualToolCallValidator", () => {
  it("should validate a tool call when the context suggests it's relevant", () => {
    const context: Context = {
      history: [
        { role: "user", content: "What is the weather like in London?" }
      ],
      userIntent: "get_weather",
      currentState: null,
      historySummary: "User asked about weather in London."
    };
    const validator = new ContextualToolCallValidator(context);
    const toolCall = { toolName: "get_weather", input: { location: "London" } };
    expect(validator.isValid(toolCall)).toBe(true);
  });

  it("should invalidate a tool call when the context is unrelated", () => {
    const context: Context = {
      history: [
        { role: "user", content: "Explain quantum physics simply." }
      ],
      userIntent: "explain_concept",
      currentState: null,
      historySummary: "User asked for an explanation of quantum physics."
    };
    const validator = new ContextualToolCallValidator(context);
    const toolCall = { toolName: "get_weather", input: { location: "Paris" } };
    expect(validator.isValid(toolCall)).toBe(false);
  });

  it("should handle missing or empty context gracefully", () => {
    const context: Context = {
      history: [],
      userIntent: null,
      currentState: null,
      historySummary: ""
    };
    const validator = new ContextualToolCallValidator(context);
    const toolCall = { toolName: "any_tool", input: {} };
    // Assuming the validator handles null/empty context by being conservative (invalidating)
    expect(validator.isValid(toolCall)).toBe(false);
  });
});