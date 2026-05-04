import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV15 } from "../src/validation/structured-thought-step-validator-v15";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV15", () => {
  it("should return valid when steps are correctly structured", () => {
    const validator = new StructuredThoughtStepValidatorV15();
    const context: { steps: Message[] } = {
      steps: [
        new UserMessage("Initial user input"),
        new AssistantMessage([
          new ThinkingBlock("Thinking process..."),
          new ToolUseBlock({ toolName: "search", toolInput: "query" }),
          new ToolResultMessage({ toolName: "search", content: "Search results" }),
          new TextBlock("Final answer based on search.")
        ])
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors if a step is missing a required block", () => {
    const validator = new StructuredThoughtStepValidatorV15();
    const context: { steps: Message[] } = {
      steps: [
        new UserMessage("User prompt"),
        new AssistantMessage([
          new ThinkingBlock("Thinking process..."),
          // Missing ToolUseBlock
          new TextBlock("Incomplete thought.")
        ])
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Assistant message must contain a ToolUseBlock after ThinkingBlock.");
  });

  it("should return invalid if the sequence of blocks is incorrect (e.g., TextBlock before ToolUseBlock)", () => {
    const validator = new StructuredThoughtStepValidatorV15();
    const context: { steps: Message[] } = {
      steps: [
        new UserMessage("User prompt"),
        new AssistantMessage([
          new ThinkingBlock("Thinking process..."),
          new TextBlock("Incorrectly placed text."),
          new ToolUseBlock({ toolName: "search", toolInput: "query" }),
        ])
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("ToolUseBlock must immediately follow ThinkingBlock.");
  });
});