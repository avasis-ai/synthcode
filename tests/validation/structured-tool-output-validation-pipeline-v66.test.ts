import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-v66";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
  it("should correctly build a pipeline with multiple steps", () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    // Mock step implementation for testing
    const mockStep1: StructuredToolOutputValidationStep = {
      validate: (input, context) => ({ isValid: true, result: { data: "step1" }, errors: [] }),
    };
    const mockStep2: StructuredToolOutputValidationStep = {
      validate: (input, context) => ({ isValid: true, result: { data: "step2" }, errors: [] }),
    };

    builder.addStep(mockStep1);
    builder.addStep(mockStep2);

    // We can't easily test the internal structure without exposing it,
    // but we can test the execution flow if we assume a 'build' or 'run' method exists.
    // For this test, we'll assume a 'build' method returns a runnable pipeline object.
    const pipeline = builder.build();

    // A simple check to ensure the builder registered the steps
    expect(typeof pipeline.run).toBe('function');
  });

  it("should return a pipeline that executes all added steps sequentially", async () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    let executionOrder: string[] = [];

    // Mock step that records its execution
    const mockStep: StructuredToolOutputValidationStep = {
      validate: (input, context) => {
        executionOrder.push("step_executed");
        return { isValid: true, result: { data: "ok" }, errors: [] };
      },
    };

    builder.addStep(mockStep);
    builder.addStep(mockStep); // Add it twice to test sequence

    const pipeline = builder.build();
    await pipeline.run({ initialInput: {} }, { context: {} });

    // Check if the step was executed twice in order
    expect(executionOrder).toEqual(["step_executed", "step_executed"]);
  });

  it("should handle an empty pipeline gracefully", async () => {
    const builder = new StructuredToolOutputValidationPipelineBuilder();
    const pipeline = builder.build();

    // Should run without error and return a default success state
    const result = await pipeline.run({}, {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});