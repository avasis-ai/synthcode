import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV39Advanced } from "../src/validation/structured-thought-step-validator-v39-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV39Advanced", () => {
  it("should validate a simple successful thought step", () => {
    const validator = new StructuredThoughtStepValidatorV39Advanced();
    const currentStep: Message = {
      role: "assistant",
      content: [
        new ThinkingBlock("Thinking process here."),
        new TextBlock("This is the final answer."),
      ],
    };
    const previousStep: Message = {
      role: "user",
      content: [new TextBlock("What is the capital of France?")],
    };

    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation if a required tool is missing in the thinking block", () => {
    const validator = new StructuredThoughtStepValidatorV39Advanced(["search_tool"]);
    const currentStep: Message = {
      role: "assistant",
      content: [
        new ThinkingBlock("I need to think about this, but I forgot to mention the required tool."),
        new TextBlock("The answer is simple."),
      ],
    };
    const previousStep: Message = {
      role: "user",
      content: [new TextBlock("Tell me about Paris.")],
    };

    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Thinking block must mention required tool: search_tool");
  });

  it("should pass validation if all required tools are mentioned", () => {
    const validator = new StructuredThoughtStepValidatorV39Advanced(["search_tool", "calculator_tool"]);
    const currentStep: Message = {
      role: "assistant",
      content: [
        new ThinkingBlock("I used the search_tool and then the calculator_tool to derive the answer."),
        new TextBlock("The final result is 42."),
      ],
    };
    const previousStep: Message = {
      role: "user",
      content: [new TextBlock("Calculate something complex.")],
    };

    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});