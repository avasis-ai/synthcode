import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV38 } from "../src/validation/structured-thought-step-validator-v38";
import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV38", () => {
  it("should return valid when steps are correctly structured", () => {
    const validator = new StructuredThoughtStepValidatorV38();
    const context: { steps: Message[] } = {
      steps: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is the capital of France?" },
          ],
        },
        {
          role: "assistant",
          content: [
            { type: "thinking", content: { tool_uses: [{ name: "search", arguments: { query: "capital of France" } }] } as ThinkingBlock },
            { type: "text", text: "The capital of France is Paris." },
          ],
        },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for missing or incorrectly typed blocks", () => {
    const validator = new StructuredThoughtStepValidatorV38();
    const context: { steps: Message[] } = {
      steps: [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello" },
          ],
        },
        {
          role: "assistant",
          content: [
            // Missing thinking block before text response
            { type: "text", text: "This response is missing a thought step." },
          ],
        },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Assistant response must start with a thinking block.");
  });

  it("should handle empty or single-step conversation history gracefully", () => {
    const validator = new StructuredThoughtStepValidatorV38();
    const context: { steps: Message[] } = {
      steps: [
        {
          role: "user",
          content: [
            { type: "text", text: "Simple query." },
          ],
        },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});