import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced } from "../src/validation/structured-tool-output-schema-validator-v1019-advanced-advanced";

describe("StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced", () => {
  it("should validate a correctly structured tool output object", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced();
    const validData = {
      toolName: "exampleTool",
      output: {
        success: true,
        data: {
          id: 123,
          name: "Test Item",
          isActive: true,
        },
      },
    };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return false and errors for missing required fields", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced();
    const invalidData = {
      toolName: "exampleTool",
      // 'output' is missing
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: output");
  });

  it("should return false and errors for incorrect data types", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1019AdvancedAdvanced();
    const invalidData = {
      toolName: 123, // Should be string
      output: {
        success: "not a boolean", // Should be boolean
        data: {
          id: "not a number", // Should be number
          name: "Test Item",
          isActive: true,
        },
      },
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for field 'toolName': Expected string, got number");
    expect(result.errors).toContain("Invalid type for field 'output.success': Expected boolean, got string");
  });
});