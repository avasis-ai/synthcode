import { describe, it, expect } from "vitest";
import { StructuredToolInputSchemaValidatorV59 } from "../src/validation/structured-tool-input-schema-validator-v59";

describe("StructuredToolInputSchemaValidatorV59", () => {
  it("should validate a correctly structured tool input object", () => {
    const validator = new StructuredToolInputSchemaValidatorV59();
    const validData = {
      tool_name: "get_current_weather",
      input: {
        location: "San Francisco",
        unit: "celsius",
      },
    };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return validation errors for missing required fields", () => {
    const validator = new StructuredToolInputSchemaValidatorV59();
    const invalidData = {
      tool_name: "get_current_weather",
      // 'input' is missing
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("input");
  });

  it("should return validation errors for incorrect data types in the input object", () => {
    const validator = new StructuredToolInputSchemaValidatorV59();
    const invalidData = {
      tool_name: "get_current_weather",
      input: {
        location: 12345, // Should be string
        unit: "celsius",
      },
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("input.location");
  });
});