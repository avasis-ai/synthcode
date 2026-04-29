import { describe, it, expect } from "vitest";
import { StructuredToolInputSchemaValidatorV1005 } from "../src/validation/structured-tool-input-schema-validator-v1005";

describe("StructuredToolInputSchemaValidatorV1005", () => {
  it("should validate a valid input structure", () => {
    const validator = new StructuredToolInputSchemaValidatorV1005();
    const validData = {
      toolName: "testTool",
      parameters: {
        param1: "value1",
        param2: 123,
      },
    };
    const result = validator.validate(validData, { data: {}, message: "" });
    expect(result.isValid).toBe(true);
  });

  it("should fail validation when required fields are missing", () => {
    const validator = new StructuredToolInputSchemaValidatorV1005();
    const invalidData = {
      toolName: "testTool",
      parameters: {}, // Missing required parameters
    };
    const result = validator.validate(invalidData, { data: {}, message: "" });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should handle cross-field validation correctly", () => {
    const validator = new StructuredToolInputSchemaValidatorV1005();
    // Assuming a scenario where toolName dictates parameter requirements
    const invalidData = {
      toolName: "specificTool",
      parameters: {
        // Missing a parameter required only for 'specificTool'
      },
    };
    const result = validator.validate(invalidData, { data: { toolName: "specificTool" }, message: "" });
    expect(result.isValid).toBe(false);
    // Check if the specific cross-field error is present (implementation dependent)
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "parameters", message: expect.stringContaining("must include required parameter") }),
    ]));
  });
});