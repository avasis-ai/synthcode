import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV12 } from "../src/validation/structured-thought-step-validator-v12";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV12", () => {
  it("should validate a simple thought step without tools or actions", () => {
    const context: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] }],
      currentThought: "The capital of France is Paris.",
      nextAction: { type: "query", query: "Paris" },
    };
    const validator = new StructuredThoughtStepValidatorV12(context);
    const isValid = validator.validate("The capital of France is Paris.");
    expect(isValid).toBe(true);
  });

  it("should validate a thought step that mentions a tool and suggests its use", () => {
    const context: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "What is the weather like in London?" }] }],
      currentThought: "I need to check the weather.",
      nextAction: { type: "tool_call", tool_name: "weather_api", input: { location: "London" } },
    };
    const validator = new StructuredThoughtStepValidatorV12(context);
    const thought = "I should use the weather_api tool to find out the current weather in London.";
    const isValid = validator.validate(thought);
    expect(isValid).toBe(true);
  });

  it("should return false if the thought step contradicts the expected next action", () => {
    const context: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] }],
      currentThought: "The capital of France is Paris.",
      nextAction: { type: "tool_call", tool_name: "weather_api", input: { location: "London" } },
    };
    const validator = new StructuredThoughtStepValidatorV12(context);
    const thought = "The capital of France is Paris, so no tool call is needed.";
    const isValid = validator.validate(thought);
    expect(isValid).toBe(false);
  });
});