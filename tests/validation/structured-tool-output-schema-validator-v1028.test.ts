import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1028";

describe("StructuredToolOutputSchemaValidator", () => {
  it("should validate a correctly structured tool output", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    const validData = {
      toolName: "exampleTool",
      output: {
        success: true,
        result: "Operation completed successfully.",
        data: {
          id: "123",
          status: "COMPLETED",
        },
      },
    };
    const errors = validator.validate(validData);
    expect(errors).toBeNull();
  });

  it("should return errors for missing required fields", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    const invalidData = {
      toolName: "exampleTool",
      output: {
        success: true,
        // 'result' is missing
        data: {
          id: "123",
          status: "COMPLETED",
        },
      },
    };
    const errors = validator.validate(invalidData);
    expect(errors).toHaveLength(1);
    expect(errors![0]).toContain("Missing required field: result");
  });

  it("should return errors for incorrect data types", () => {
    const validator = new StructuredToolOutputSchemaValidator();
    const invalidData = {
      toolName: 12345, // Should be string
      output: {
        success: "not a boolean", // Should be boolean
        result: "Some result",
        data: {
          id: "123",
          status: "INVALID",
        },
      },
    };
    const errors = validator.validate(invalidData);
    expect(errors).toHaveLength(2);
    expect(errors!.some(e => e.includes("toolName"))).toBe(true);
    expect(errors!.some(e => e.includes("success"))).toBe(true);
  });
});