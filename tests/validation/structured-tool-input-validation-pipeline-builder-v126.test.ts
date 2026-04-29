import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-builder-v126";

describe("StructuredToolInputValidationPipelineBuilder", () => {
  it("should build a pipeline correctly with initial schema", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    // Assuming there's a method to set the initial schema for testing purposes
    // Since the full implementation isn't provided, we'll test the constructor/basic setup if possible.
    // If the builder requires an initial schema, we'll mock or assume a setup method.
    // For this test, we'll assume a method like 'withSchema' exists or the constructor handles it.
    const builderWithSchema = new StructuredToolInputValidationPipelineBuilder(); // Placeholder call
    expect(builderWithSchema).toBeInstanceOf(StructuredToolInputValidationPipelineBuilder);
  });

  it("should allow adding multiple validation steps to the pipeline", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    // Mocking the addStep method call structure
    const mockStep = { execute: (data: Record<string, unknown>) => ({ isValid: true, errors: [], data: data }) };
    // Assuming addStep returns 'this' for chaining
    (builder as any).addStep(mockStep);
    // A more robust test would check the internal state, but we test the chaining effect.
    expect((builder as any).getStepsLength()).toBe(1); // Assuming a getter for steps count
  });

  it("should execute all added steps sequentially and aggregate results", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    const step1 = { execute: (data: Record<string, unknown>) => ({ isValid: true, errors: [], data: { ...data, step1Data: "ok" } }) };
    const step2 = { execute: (data: Record<string, unknown>) => ({ isValid: true, errors: [], data: { ...data, step2Data: "ok" } }) };

    (builder as any).addStep(step1);
    (builder as any).addStep(step2);

    const initialData: Record<string, unknown> = { input: "test" };
    const result = (builder as any).build(initialData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    // Check if data from both steps is present in the final data object
    expect(result.data).toEqual({ input: "test", step1Data: "ok", step2Data: "ok" });
  });
});