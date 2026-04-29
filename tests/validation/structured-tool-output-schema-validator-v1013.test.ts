import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1013";

describe("SchemaValidator", () => {
  it("should return valid result when all steps pass", () => {
    const validator = new SchemaValidator();
    // Mock a passing step
    const mockStep = {
      validate: (data: unknown): { isValid: boolean; errors: string[] } => ({
        isValid: true,
        errors: [],
      }),
    };
    validator.addStep(mockStep);

    const result = validator.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple failing steps", () => {
    const validator = new SchemaValidator();
    // Mock a failing step 1
    const mockStep1 = {
      validate: (data: unknown): { isValid: boolean; errors: string[] } => ({
        isValid: false,
        errors: ["Error from step 1"],
      }),
    };
    // Mock a failing step 2
    const mockStep2 = {
      validate: (data: unknown): { isValid: boolean; errors: string[] } => ({
        isValid: false,
        errors: ["Error from step 2"],
      }),
    };
    validator.addStep(mockStep1);
    validator.addStep(mockStep2);

    const result = validator.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining(["Error from step 1", "Error from step 2"]));
  });

  it("should return valid result if some steps pass and some fail", () => {
    const validator = new SchemaValidator();
    // Mock a passing step
    const mockStepPass = {
      validate: (data: unknown): { isValid: boolean; errors: string[] } => ({
        isValid: true,
        errors: [],
      }),
    };
    // Mock a failing step
    const mockStepFail = {
      validate: (data: unknown): { isValid: boolean; errors: string[] } => ({
        isValid: false,
        errors: ["Specific failure"],
      }),
    };
    validator.addStep(mockStepPass);
    validator.addStep(mockStepFail);

    const result = validator.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors).toContain("Specific failure");
  });
});