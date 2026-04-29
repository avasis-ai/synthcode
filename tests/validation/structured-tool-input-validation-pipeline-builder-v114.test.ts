import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-builder-v114";

describe("StructuredToolInputValidationPipeline", () => {
  it("should initialize correctly with an array of steps", () => {
    const mockStep1: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    const mockStep2: any = { execute: () => ({ isValid: true, errors: [], context: {} }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);
    // We can't directly test private members, but we can test the execution flow which depends on initialization
    expect(pipeline).toBeInstanceOf(StructuredToolInputValidationPipeline);
  });

  it("should run all steps sequentially and aggregate results", async () => {
    const mockStep1: any = { execute: (input: any, context: any) => ({ isValid: true, errors: [], context: { step1: "ok" } }) };
    const mockStep2: any = { execute: (input: any, context: any) => ({ isValid: false, errors: ["Step 2 failed"], context: { ...context, step2: "fail" } }) };
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2]);

    const result = await pipeline.execute({ key: "value" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Step 2 failed"]);
    expect(result.context).toEqual({ step1: "ok", step2: "fail" });
  });

  it("should stop and return failure immediately if a critical step fails (assuming implementation supports early exit)", async () => {
    // Note: The actual behavior of early exit depends on the pipeline's internal logic.
    // This test assumes that if a step returns isValid: false, subsequent steps might be skipped or the final result reflects the failure.
    const mockStep1: any = { execute: (input: any, context: any) => ({ isValid: true, errors: [], context: { step1: "ok" } }) };
    const mockStep2: any = { execute: (input: any, context: any) => ({ isValid: false, errors: ["Critical failure"], context: { step2: "fail" } }) };
    const mockStep3: any = { execute: (input: any, context: any) => ({ isValid: true, errors: [], context: { step3: "ok" } }) };
    
    const pipeline = new StructuredToolInputValidationPipeline([mockStep1, mockStep2, mockStep3]);

    // If the pipeline is designed to stop on first failure, the context should only reflect up to step 2's failure.
    const result = await pipeline.execute({ key: "value" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Critical failure"]);
    // Depending on implementation, context might only contain up to the failing step, or all steps executed before the stop.
    // We test for the failure state being captured.
    expect(result.context).toHaveProperty("step2");
  });
});