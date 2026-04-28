import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v21";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should return valid result when all steps pass", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({}, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple failing steps", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: false, errors: ["Error from step 1"] }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: false, errors: ["Error from step 2"] }) };
    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({}, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 1", "Error from step 2"]);
  });

  it("should return correct result when some steps pass and some fail", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: false, errors: ["Error from step 2"] }) };
    const mockStep3: any = { validate: (data: any, context: any) => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2, mockStep3]);
    const result = pipeline.validate({}, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 2"]);
  });
});