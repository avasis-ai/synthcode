import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v102";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should build a pipeline with a single step correctly", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const step1: (data: unknown) => { isValid: boolean; error?: string } = (data) => ({ isValid: true });
    const pipeline = builder.addStep(step1).build();

    expect(typeof pipeline.validate).toBe("function");
    expect(pipeline.validate(null)).toEqual({ isValid: true });
  });

  it("should build a pipeline that fails validation when any step fails", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const failingStep: (data: unknown) => { isValid: boolean; error?: string } = () => ({ isValid: false, error: "Validation failed" });
    const succeedingStep: (data: unknown) => { isValid: boolean; error?: string } = () => ({ isValid: true });

    // Assuming default failure mode is 'fail_fast' or similar for this test case
    const pipeline = builder.addStep(succeedingStep).addStep(failingStep).build();

    // Since the second step fails, the pipeline should report failure
    const result = pipeline.validate({});
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Validation failed");
  });

  it("should allow building a pipeline with multiple steps that all pass", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const step1: (data: unknown) => { isValid: boolean; error?: string } = () => ({ isValid: true });
    const step2: (data: unknown) => { isValid: boolean; error?: string } = () => ({ isValid: true });

    const pipeline = builder.addStep(step1).addStep(step2).build();

    const result = pipeline.validate({});
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});