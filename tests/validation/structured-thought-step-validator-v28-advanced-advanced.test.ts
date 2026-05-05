import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV28AdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v28-advanced-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV28AdvancedAdvanced", () => {
  const validator = new StructuredThoughtStepValidatorV28AdvancedAdvanced();

  it("should return invalid if current step is missing", () => {
    const context = { steps: [], currentIndex: 0 };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Current step is missing.");
  });

  it("should validate a simple, valid thinking step", () => {
    const validStep: Message = {
      role: "user",
      content: [
        new TextBlock("This is a thought process."),
      ],
    };
    const context = { steps: [validStep], currentIndex: 0 };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an invalid structure when a tool use block is present without proper context", () => {
    const invalidStep: Message = {
      role: "assistant",
      content: [
        new ToolUseBlock({ toolName: "nonExistentTool", input: "data" }),
      ],
    };
    const context = { steps: [
      { role: "user", content: [new TextBlock("Initial prompt")] },
      invalidStep,
    ], currentIndex: 1 };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("ToolUseBlock requires a preceding ThinkingBlock.");
  });
});