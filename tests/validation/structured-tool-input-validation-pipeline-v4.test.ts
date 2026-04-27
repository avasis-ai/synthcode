import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV4 } from "../src/validation/structured-tool-input-validation-pipeline-v4";

describe("StructuredToolInputValidationPipelineV4", () => {
  it("should validate a completely valid input structure", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV4();
    const validContext: Record<string, unknown> = {
      messages: [
        { role: "user", content: { type: "text", value: "Hello" } }
      ]
    };
    const validInput: Record<string, unknown> = {
      tool_calls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: JSON.stringify({ location: "Tokyo" })
          }
        }
      ],
      messages: [
        { role: "user", content: { type: "text", value: "What is the weather in Tokyo?" } }
      ]
    };

    const result = await pipeline.validate(validContext, validInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required fields in the input", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV4();
    const context: Record<string, unknown> = {};
    const invalidInput: Record<string, unknown> = {
      // Missing tool_calls entirely
      messages: [
        { role: "user", content: { type: "text", value: "Test" } }
      ]
    };

    const result = await pipeline.validate(context, invalidInput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: tool_calls");
  });

  it("should handle an empty or null input gracefully", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV4();
    const context: Record<string, unknown> = {};
    const emptyInput: Record<string, unknown> = {};

    const result = await pipeline.validate(context, emptyInput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: tool_calls");
  });
});