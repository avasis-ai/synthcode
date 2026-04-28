import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v38";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should correctly validate output when all steps pass", () => {
    const mockValidator1: StructuredToolOutputValidator = {
      validate: (output) => ({ isValid: true, errors: [] }),
    };
    const mockValidator2: StructuredToolOutputValidator = {
      validate: (output) => ({ isValid: true, errors: [] }),
    };

    const pipeline = StructuredToolOutputValidationPipeline.create([
      { validator: mockValidator1, name: "Step 1" },
      { validator: mockValidator2, name: "Step 2" },
    ]);

    const result = pipeline.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple failing steps", () => {
    const mockValidator1: StructuredToolOutputValidator = {
      validate: (output) => ({ isValid: false, errors: ["Error in Step 1"] }),
    };
    const mockValidator2: StructuredToolOutputValidator = {
      validate: (output) => ({ isValid: false, errors: ["Error in Step 2"] }),
    };

    const pipeline = StructuredToolOutputValidationPipeline.create([
      { validator: mockValidator1, name: "Step 1" },
      { validator: mockValidator2, name: "Step 2" },
    ]);

    const result = pipeline.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in Step 1", "Error in Step 2"]);
  });

  it("should return true if there are no steps configured", () => {
    const pipeline = StructuredToolOutputValidationPipeline.create([]);
    const result = pipeline.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});