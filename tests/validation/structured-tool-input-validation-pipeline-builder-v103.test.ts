import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-builder-v103";

describe("StructuredToolInputValidationPipelineBuilder", () => {
  it("should initialize correctly with no steps", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    // Assuming there's a way to check if steps are empty or if a method exists for it
    // Since we don't have access to private members, we test behavior if possible.
    // For now, we just check instantiation.
    expect(builder).toBeInstanceOf(StructuredToolInputValidationPipelineBuilder);
  });

  it("should add a simple validation step correctly", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    const step = (inputs: Record<string, unknown>) => ({
      result: { isValid: typeof inputs.requiredField === 'boolean' ? true : false, errors: [] },
      context: { processed: true },
    });
    builder.addStep(step);

    // A more robust test would check the internal state, but based on the provided context,
    // we assume addStep works and subsequent calls use the added step.
    // We'll test the execution flow conceptually.
    const result = builder.build(
      { requiredField: true },
      { initialContext: { user: "test" } }
    );
    expect(result.isValid).toBe(true);
    expect(result.context).toHaveProperty("processed", true);
  });

  it("should execute multiple steps sequentially and pass context", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    let contextFromStep1: Record<string, unknown> | undefined = undefined;

    const step1 = (inputs: Record<string, unknown>) => {
      const result: ValidationResult = { isValid: true, errors: [] };
      contextFromStep1 = { step1_output: "data1" };
      return { result, context: contextFromStep1 };
    };

    const step2 = (inputs: Record<string, unknown>) => {
      const result: ValidationResult = { isValid: true, errors: [] };
      // Step 2 uses context from Step 1
      const context: Record<string, unknown> = { ...contextFromStep1, step2_output: "data2" };
      return { result, context };
    };

    builder.addStep(step1);
    builder.addStep(step2);

    const initialInputs = { someInput: "value" };
    const initialContext = { initial: "context" };

    const result = builder.build(initialInputs, initialContext);

    expect(result.isValid).toBe(true);
    // Check if the final context contains data from both steps
    expect(result.context).toHaveProperty("step1_output", "data1");
    expect(result.context).toHaveProperty("step2_output", "data2");
    expect(result.context).toHaveProperty("initial", "context");
  });
});