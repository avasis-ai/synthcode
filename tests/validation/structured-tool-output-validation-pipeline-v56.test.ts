import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v56";

describe("StructuredToolOutputValidator", () => {
  it("should return a valid result for a perfectly structured output", () => {
    const validator = StructuredToolOutputValidator.getInstance();
    const validOutput = {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Hello world",
          },
        },
        {
          role: "assistant",
          content: {
            type: "tool_use",
            tool_use: {
              tool_name: "get_weather",
              tool_input: { location: "San Francisco" },
            },
          },
        },
        {
          role: "tool",
          content: {
            type: "tool_result",
            tool_result: {
              tool_name: "get_weather",
              content: "Sunny and 72F",
            },
          },
        },
      ],
    };
    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing 'messages' array", () => {
    const validator = StructuredToolOutputValidator.getInstance();
    const invalidOutput = {
      someOtherKey: "data",
    };
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: messages");
  });

  it("should detect an invalid message structure (e.g., missing role)", () => {
    const validator = StructuredToolOutputValidator.getInstance();
    const invalidOutput = {
      messages: [
        {
          content: {
            type: "text",
            text: "Some message",
          },
        },
      ],
    };
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Message object is missing required field: role");
  });
});