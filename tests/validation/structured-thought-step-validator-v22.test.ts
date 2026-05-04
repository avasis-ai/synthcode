import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV22 } from "../src/validation/structured-thought-step-validator-v22";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV22", () => {
  it("should validate a simple thinking step when previous message was an assistant response", () => {
    const previousMessage: Message = {
      role: "assistant",
      content: [
        { type: "text", content: "Thinking..." },
        { type: "thinking", content: "This is my thought process." }
      ] as unknown as ContentBlock[];
    };
    const validator = new StructuredThoughtStepValidatorV22(previousMessage);
    const validStep = {
      type: "thinking",
      content: "This is the next thought step.",
    };
    expect(validator.isValid(validStep)).toBe(true);
  });

  it("should return false if the thinking step content is empty", () => {
    const previousMessage: Message = {
      role: "assistant",
      content: [
        { type: "thinking", content: "Some thought." }
      ] as unknown as ContentBlock[];
    };
    const validator = new StructuredThoughtStepValidatorV22(previousMessage);
    const invalidStep = {
      type: "thinking",
      content: "",
    };
    expect(validator.isValid(invalidStep)).toBe(false);
  });

  it("should return false if the previous message was not from the assistant", () => {
    const previousMessage: Message = {
      role: "user",
      content: [{ type: "text", content: "Hello" }] as unknown as ContentBlock[];
    };
    const validator = new StructuredThoughtStepValidatorV22(previousMessage);
    const validStep = {
      type: "thinking",
      content: "This is a thought step.",
    };
    expect(validator.isValid(validStep)).toBe(false);
  });
});