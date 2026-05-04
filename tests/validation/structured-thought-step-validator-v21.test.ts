import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV21 } from "../src/validation/structured-thought-step-validator-v21";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV21", () => {
  it("should validate a basic valid thought step", () => {
    const mockContext: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] }],
      stepResults: {},
    };
    const validator = new StructuredThoughtStepValidatorV21(mockContext);
    const step = {
      thought: "The capital of France is Paris.",
      action: null,
      toolCalls: [],
    };
    const result = validator.validate(step);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing thought content when required", () => {
    const mockContext: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "Explain quantum entanglement." }] }],
      stepResults: {},
    };
    const validator = new StructuredThoughtStepValidatorV21(mockContext);
    const step = {
      thought: undefined, // Missing thought
      action: null,
      toolCalls: [],
    };
    const result = validator.validate(step);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Thought content is required.");
  });

  it("should validate a step with tool use and correct structure", () => {
    const mockContext: any = {
      history: [
        { role: "user", content: [{ type: "text", text: "Get the weather in London." }] }],
      stepResults: {},
    };
    const validator = new StructuredThoughtStepValidatorV21(mockContext);
    const step = {
      thought: "I need to check the weather for London.",
      action: {
        toolName: "weather_api",
        parameters: { location: "London" },
      },
      toolCalls: [],
    };
    const result = validator.validate(step);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});