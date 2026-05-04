import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV29AdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v29-advanced-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV29AdvancedAdvanced", () => {
  const validator = new StructuredThoughtStepValidatorV29AdvancedAdvanced();
  const mockContext: ValidationContext = {
    globalState: { user: "testUser" },
    resourceMetrics: { cpu: 10, memory: 20 },
    previousSteps: [
      new AssistantMessage("Previous step content")
    ]
  };

  it("should validate a perfectly formed AssistantMessage with thinking and content", () => {
    const validStep: Message = {
      type: "assistant",
      content: [
        new ThinkingBlock("Thinking process here."),
        new ContentBlock([new TextBlock("Final answer text.")])
      ],
      toolUses: []
    } as any; // Mocking complex types for simplicity in test setup

    const result = validator.validate(validStep, mockContext);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.enrichedContext).toBeDefined();
  });

  it("should fail validation if the message is missing required content blocks", () => {
    const invalidStep: Message = {
      type: "assistant",
      content: [
        new ThinkingBlock("Thinking process."),
        // Missing ContentBlock
      ],
      toolUses: []
    } as any;

    const result = validator.validate(invalidStep, mockContext);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Message must contain at least one ContentBlock"));
  });

  it("should pass validation for a simple UserMessage without complex blocks", () => {
    const validUserStep: Message = {
      type: "user",
      content: [
        new TextBlock("Hello world!")
      ],
      toolUses: []
    } as any;

    const result = validator.validate(validUserStep, mockContext);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});