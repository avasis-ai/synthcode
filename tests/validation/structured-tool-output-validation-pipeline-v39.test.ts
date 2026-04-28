import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v39";
import { Schema, ValidationStep, StructuredToolOutput } from "../src/validation/structured-tool-output-validation-pipeline-v38";

describe("StructuredToolOutputValidator", () => {
  it("should correctly validate a perfectly structured output", () => {
    const mockSchema: Schema = { type: "object", properties: {} };
    const mockSteps: ValidationStep<StructuredToolOutput>[] = [
      {
        validate: (output: StructuredToolOutput) => {
          if (output.success && output.data) {
            return { isValid: true, errors: [] };
          }
          return { isValid: false, errors: ["Validation failed"] };
        },
        name: "SuccessCheck",
      },
    ];
    const validator = new StructuredToolOutputValidator(mockSchema, mockSteps);
    const validOutput: StructuredToolOutput = { success: true, data: { key: "value" } };

    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation when the output structure is incorrect", () => {
    const mockSchema: Schema = { type: "object", properties: {} };
    const mockSteps: ValidationStep<StructuredToolOutput>[] = [
      {
        validate: (output: StructuredToolOutput) => {
          if (output.success && output.data) {
            return { isValid: true, errors: [] };
          }
          return { isValid: false, errors: ["Validation failed"] };
        },
        name: "SuccessCheck",
      },
    ];
    const validator = new StructuredToolOutputValidator(mockSchema, mockSteps);
    const invalidOutput: StructuredToolOutput = { success: false, data: null };

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Validation failed"]));
  });

  it("should aggregate errors from multiple validation steps", () => {
    const mockSchema: Schema = { type: "object", properties: {} };
    const mockSteps: ValidationStep<StructuredToolOutput>[] = [
      {
        validate: (output: StructuredToolOutput) => {
          if (!output.success) {
            return { isValid: false, errors: ["Step 1 Error: Success flag missing"] };
          }
          return { isValid: true, errors: [] };
        },
        name: "Step1",
      },
      {
        validate: (output: StructuredToolOutput) => {
          if (typeof output.data?.key !== 'string') {
            return { isValid: false, errors: ["Step 2 Error: Data key must be string"] };
          }
          return { isValid: true, errors: [] };
        },
        name: "Step2",
      },
    ];
    const validator = new StructuredToolOutputValidator(mockSchema, mockSteps);
    const partiallyInvalidOutput: StructuredToolOutput = { success: false, data: { key: 123 } };

    const result = validator.validate(partiallyInvalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining([
      "Step 1 Error: Success flag missing",
      "Step 2 Error: Data key must be string",
    ]));
  });
});