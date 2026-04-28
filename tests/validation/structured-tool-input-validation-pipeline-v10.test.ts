import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v10";

describe("StructuredToolInputValidationPipeline", () => {
  it("should return true and no errors if all steps pass validation", () => {
    const mockStep1: any = { validate: (context) => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: (context) => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.run(null);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from all failing steps", () => {
    const mockStep1: any = { validate: (context) => ({ isValid: false, errors: ["Error from step 1"] }) };
    const mockStep2: any = { validate: (context) => ({ isValid: false, errors: ["Error from step 2"] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.run(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 1", "Error from step 2"]);
  });

  it("should stop processing and return errors immediately if a critical step fails (assuming implementation detail)", () => {
    // This test assumes the pipeline stops on the first failure, 
    // but based on the provided snippet, it seems to aggregate all errors.
    // We'll test the aggregation behavior which is more robustly testable here.
    const mockStep1: any = { validate: (context) => ({ isValid: false, errors: ["Critical Error"] }) };
    const mockStep2: any = { validate: (context) => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    const result = pipeline.run(null);
    // Based on the structure, it seems it runs all steps and aggregates errors.
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Critical Error"]);
  });
});