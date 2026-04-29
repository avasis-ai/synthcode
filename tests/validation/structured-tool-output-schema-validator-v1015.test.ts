import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1015 } from "../src/validation/structured-tool-output-schema-validator-v1015";

describe("StructuredToolOutputSchemaValidatorV1015", () => {
  it("should validate a correctly structured tool output", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1015();
    const validOutput = {
      type: "tool_output",
      tool_call_id: "call_abc123",
      content: [
        { type: "tool_result", tool_result: { tool_name: "get_weather", content: "Sunny and 25C" } }
      ]
    };
    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if the top-level type is incorrect", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1015();
    const invalidOutput = {
      type: "text",
      content: [{ type: "text", text: "Some text" }]
    };
    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Root message type must be 'tool_output'");
  });

  it("should handle missing required fields gracefully", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1015();
    const incompleteOutput = {
      type: "tool_output",
      // Missing tool_call_id
      content: []
    };
    const result = validator.validate(incompleteOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: tool_call_id");
  });
});