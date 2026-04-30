import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorAdvancedAdvanced } from "../src/validation/structured-tool-output-schema-validator-v1013-advanced-advanced";

describe("StructuredToolOutputSchemaValidatorAdvancedAdvanced", () => {
  it("should validate a perfectly structured and complete output", () => {
    const validator = new StructuredToolOutputSchemaValidatorAdvancedAdvanced();
    const validData = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello world" },
          ],
        },
        {
          role: "assistant",
          content: [
            { type: "tool_use", tool_use: { tool_call_id: "call1", tool_name: "get_weather", tool_input: { location: "Tokyo" } } },
          ],
        },
        {
          role: "tool",
          content: [
            { type: "tool_result", tool_result: { tool_call_id: "call1", content: "Sunny and 25C" } },
          ],
        },
      ],
    };
    const result = validator.validate(validData, {});
    expect(result.isValid).toBe(true);
  });

  it("should fail validation when required 'messages' array is missing", () => {
    const validator = new StructuredToolOutputSchemaValidatorAdvancedAdvanced();
    const invalidData = {
      // messages array is missing
      otherField: "some value",
    };
    const result = validator.validate(invalidData, {});
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("messages");
  });

  it("should fail validation if a message object is missing the 'role'", () => {
    const validator = new StructuredToolOutputSchemaValidatorAdvancedAdvanced();
    const invalidData = {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Test" }],
        },
        {
          // role is missing here
          content: [{ type: "tool_result", tool_result: { tool_call_id: "call1", content: "Error" } }],
        },
      ],
    };
    const result = validator.validate(invalidData, {});
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("role");
  });
});