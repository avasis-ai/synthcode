import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1014";
import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredToolOutputSchemaValidator", () => {
  it("should validate a correctly structured tool output", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    // Mocking a successful validation scenario for demonstration
    // In a real test, you would use the actual methods/setup of the validator
    const result = validator.validate({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", content: "Hello world" } as ContentBlock
          ]
        },
        {
          role: "assistant",
          content: [
            { type: "tool_use", tool_use: { tool_name: "get_weather", tool_input: { location: "Tokyo" } } } as ContentBlock
          ]
        },
        {
          role: "tool",
          content: [
            { type: "tool_result", tool_result: { tool_name: "get_weather", content: "Sunny" } } as ContentBlock
          ]
        }
      ]
    } as any); // Casting for simplified test structure

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required fields in the message structure", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    // Mocking a validation failure due to missing data
    const invalidData = {
      messages: [
        {
          role: "user",
          content: [] // Missing content array elements
        }
      ]
    };
    const result = validator.validate(invalidData) as any;

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Message content is required.");
  });

  it("should handle mixed content types correctly", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    // Mocking a scenario with multiple content blocks
    const mixedContent = {
      messages: [
        {
          role: "assistant",
          content: [
            { type: "text", content: "Initial thought." } as ContentBlock,
            { type: "tool_use", tool_use: { tool_name: "search", tool_input: { query: "test" } } } as ContentBlock
          ]
        }
      ]
    };
    const result = validator.validate(mixedContent) as any;

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});