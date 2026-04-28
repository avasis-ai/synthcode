import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV25 } from "../src/validation/structured-tool-input-validation-pipeline-v25";

describe("StructuredToolInputValidationPipelineV25", () => {
  it("should initialize correctly with provided steps and context", () => {
    const mockStep1: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: () => ({ isValid: true, errors: [] }) };
    const context: Record<string, unknown> = { user: "test" };
    const pipeline = new StructuredToolInputValidationPipelineV25([mockStep1, mockStep2], context);

    // We can't directly test private members, but we can test its usage pattern
    // by ensuring it runs without error and that the context is set.
    expect(pipeline).toBeInstanceOf(StructuredToolInputValidationPipelineV25);
  });

  it("should run all validation steps sequentially and aggregate errors", () => {
    const mockStep1: any = { validate: () => ({ isValid: false, errors: ["Error 1"] }) };
    const mockStep2: any = { validate: () => ({ isValid: false, errors: ["Error 2"] }) };
    const context: Record<string, unknown> = {};
    const pipeline = new StructuredToolInputValidationPipelineV25([mockStep1, mockStep2], context);

    // Mocking the internal execution to check aggregation logic
    // Since we can't easily mock private methods, we'll rely on calling the main validation method
    // and checking if the resulting errors contain both expected errors.
    const result = pipeline.validate(context, { data: "invalid input" });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Error 1", "Error 2"]));
    expect(result.errors.length).toBe(2);
  });

  it("should return valid if all steps pass validation", () => {
    const mockStep1: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: () => ({ isValid: true, errors: [] }) };
    const context: Record<string, unknown> = {};
    const pipeline = new StructuredToolInputValidationPipelineV25([mockStep1, mockStep2], context);

    const result = pipeline.validate(context, { data: "valid input" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});