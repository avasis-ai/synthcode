import { describe, it, expect } from "vitest";
import { ToolInputValidationPipeline } from "../src/pipeline/tool-input-validation-pipeline.js";

describe("ToolInputValidationPipeline", () => {
  it("should return valid result when all steps pass validation", () => {
    const mockStep1: any = (inputs: any) => ({ isValid: true, errors: [] });
    const mockStep2: any = (inputs: any) => ({ isValid: true, errors: [] });
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.run({ key1: "value1", key2: 123 });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should aggregate errors from multiple failing steps", () => {
    const mockStep1: any = (inputs: any) => ({
      isValid: false,
      errors: [{ stepName: "Step1", message: "Error in step 1" }],
    });
    const mockStep2: any = (inputs: any) => ({
      isValid: false,
      errors: [{ stepName: "Step2", message: "Error in step 2" }],
    });
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.run({ key1: "value1", key2: 123 });

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ stepName: "Step1", message: "Error in step 1" }),
      expect.objectContaining({ stepName: "Step2", message: "Error in step 2" }),
    ]));
  });

  it("should stop processing or continue based on implementation (assuming it processes all steps)", () => {
    const mockStep1: any = (inputs: any) => ({
      isValid: false,
      errors: [{ stepName: "Step1", message: "Critical error" }],
    });
    const mockStep2: any = (inputs: any) => ({
      isValid: true,
      errors: [],
    });
    const pipeline = new ToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = pipeline.run({ key1: "value1" });

    // Based on the provided context, we assume it runs all steps and aggregates errors.
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});