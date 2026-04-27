import { describe, it, expect } from "vitest";
import { ToolOutputValidationPipeline, ValidationStep } from "../src/validation/tool-output-validation-pipeline";
import { z } from "zod";

describe("ToolOutputValidationPipeline", () => {
  it("should pass validation if all steps succeed and final schema matches", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any) => ({ isValid: true, output: { data: "step1_output" } }),
    };
    const mockStep2: ValidationStep = {
      validate: (input: any) => ({ isValid: true, output: { data: "step2_output" } }),
    };
    const pipeline = new ToolOutputValidationPipeline([mockStep1, mockStep2], z.object({ data: z.string() }));

    const result = pipeline.validate({ initial: true });

    expect(result.isValid).toBe(true);
    expect(result.finalOutput).toEqual({ data: "step2_output" });
    expect(result.errors).toEqual([]);
  });

  it("should fail validation if any step fails", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any) => ({ isValid: true, output: { data: "step1_output" } }),
    };
    const mockStep2: ValidationStep = {
      validate: (input: any) => ({ isValid: false, output: null, error: "Step 2 failed validation" }),
    };
    const pipeline = new ToolOutputValidationPipeline([mockStep1, mockStep2], z.object({ data: z.string() }));

    const result = pipeline.validate({ initial: true });

    expect(result.isValid).toBe(false);
    expect(result.finalOutput).toBeNull();
    expect(result.errors).toContain("Step 2 failed validation");
  });

  it("should fail validation if the final schema validation fails", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any) => ({ isValid: true, output: { data: 123 } }),
    };
    const pipeline = new ToolOutputValidationPipeline([mockStep1], z.object({ data: z.string() }));

    const result = pipeline.validate({ initial: true });

    expect(result.isValid).toBe(false);
    expect(result.finalOutput).toBeNull();
    expect(result.errors).toContain("Invalid data type for 'data'");
  });
});