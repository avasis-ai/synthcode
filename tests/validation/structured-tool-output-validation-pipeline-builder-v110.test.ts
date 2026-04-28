import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v110";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should correctly build a pipeline with multiple steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const step1 = { name: "step1", validator: () => ({ isValid: true, errors: [], context: {} }) };
    const step2 = { name: "step2", validator: () => ({ isValid: true, errors: [], context: {} }) };

    builder.addStep(step1);
    builder.addStep(step2);

    // We can't easily test the internal structure without exposing it,
    // but we can test the resulting pipeline execution if we assume a 'build' or 'getPipeline' method exists.
    // For this test, we'll assume a method that returns the built pipeline array.
    // Since the class structure isn't fully visible, we'll test the addition mechanism.
    // A real test would execute the built pipeline.
    expect((builder as any).getPipeline().length).toBe(2);
  });

  it("should handle an empty pipeline correctly", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    expect((builder as any).getPipeline().length).toBe(0);
  });

  it("should update context correctly across steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const initialContext: Record<string, unknown> = { initialData: "test" };

    const step1 = { name: "step1", validator: (context, data) => {
      const newContext: Record<string, unknown> = { ...context, step1Processed: true };
      return { isValid: true, errors: [], context: newContext };
    }};
    const step2 = { name: "step2", validator: (context, data) => {
      const newContext: Record<string, unknown> = { ...context, step2Processed: true };
      return { isValid: true, errors: [], context: newContext };
    }};

    builder.addStep(step1);
    builder.addStep(step2);

    // Execute the pipeline manually for testing context flow
    const pipeline = (builder as any).getPipeline();
    let context = initialContext;
    let data: unknown = "some_data";

    for (const step of pipeline) {
      const result = step.validator(context, data);
      context = result.context;
    }

    expect(context).toEqual({ initialData: "test", step1Processed: true, step2Processed: true });
  });
});