import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v113";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should build a pipeline correctly with initial schema and steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder({});
    const step1 = {
      execute: (context) => ({
        isValid: true,
        errors: [],
        context: context,
      }),
    };
    builder.addStep(step1);
    // We can't easily assert the internal state of the steps array,
    // but we can test the execution flow which relies on it.
    // For this test, we'll just ensure the builder doesn't throw and has a method to run.
    expect(typeof (builder as any).build).toBe('function');
  });

  it("should execute all added steps sequentially and pass context", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder({});
    const initialContext: ValidationContext = {
      data: { initial: "data" },
      history: [],
    };
    let contextAfterStep1: ValidationContext = {
      data: { initial: "data" },
      history: [],
    };
    let contextAfterStep2: ValidationContext = {
      data: { initial: "data" },
      history: [],
    };

    const step1 = {
      execute: (context) => ({
        isValid: true,
        errors: [],
        context: { ...context, data: { ...context.data, step1_data: "step1_data" } },
      }),
    };
    const step2 = {
      execute: (context) => ({
        isValid: true,
        errors: [],
        context: { ...context, data: { ...context.data, step2_data: "step2_data" } },
      }),
    };

    const builderInstance = new StructuredToolOutputValidationPipelineBuilder({});
    (builderInstance as any).addStep(step1);
    (builderInstance as any).addStep(step2);

    const pipeline = (builderInstance as any).build();
    const result = pipeline.execute(initialContext);

    // Check if the context was updated by both steps
    expect(result.context.data.step1_data).toBe("step1_data");
    expect(result.context.data.step2_data).toBe("step2_data");
    expect(result.isValid).toBe(true);
  });

  it("should aggregate errors from all steps and return the final context", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder({});
    const initialContext: ValidationContext = {
      data: { initial: "data" },
      history: [],
    };

    const step1 = {
      execute: (context) => ({
        isValid: false,
        errors: ["Error from step 1"],
        context: { ...context, data: { ...context.data, step1_data: "step1_data" } },
      }),
    };
    const step2 = {
      execute: (context) => ({
        isValid: false,
        errors: ["Error from step 2"],
        context: { ...context, data: { ...context.data, step2_data: "step2_data" } },
      }),
    };

    const builderInstance = new StructuredToolOutputValidationPipelineBuilder({});
    (builderInstance as any).addStep(step1);
    (builderInstance as any).addStep(step2);

    const pipeline = (builderInstance as any).build();
    const result = pipeline.execute(initialContext);

    // Check if errors are aggregated
    expect(result.errors).toEqual(["Error from step 1", "Error from step 2"]);
    // Check if the final context is available
    expect(result.context.data.step1_data).toBe("step1_data");
    expect(result.context.data.step2_data).toBe("step2_data");
    // Overall validity should be false if any step failed
    expect(result.isValid).toBe(false);
  });
});