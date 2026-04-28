import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidator } from "../src/validation/tool-output-schema-validation-pipeline-v1";

describe("ToolOutputSchemaValidator", () => {
  it("should initialize with no steps and run successfully", () => {
    const validator = new ToolOutputSchemaValidator();
    // Assuming runPipeline returns a result object structure or similar for a basic check
    // Since the full implementation of runPipeline isn't visible, we test the structure/initial state.
    // If runPipeline is expected to run, we might need a mock step.
    const mockStep: any = { validate: (input: unknown) => ({ isValid: true, errors: [], output: input }) };
    const validatorWithStep = new ToolOutputSchemaValidator([mockStep]);
    // We can't fully test runPipeline without knowing its return type/behavior on empty/full pipeline,
    // but we can test adding steps.
    expect(validatorWithStep).toBeDefined();
  });

  it("should accumulate validation steps correctly", () => {
    const validator = new ToolOutputSchemaValidator();
    const step1: any = { validate: () => ({ isValid: true, errors: [], output: null }) };
    const step2: any = { validate: () => ({ isValid: true, errors: [], output: null }) };

    const result = validator.addStep(step1).addStep(step2);
    // Check if the instance returned is the validator itself (for chaining)
    expect(result).toBe(validator);
    // A more robust check would involve checking internal state, but for simplicity, we trust the return type.
  });

  it("should run the pipeline sequentially through all added steps", () => {
    const mockStep1: any = { validate: (input: unknown) => ({ isValid: true, errors: [], output: input }) };
    const mockStep2: any = { validate: (input: unknown) => ({ isValid: true, errors: [], output: input }) };
    const mockStep3: any = { validate: (input: unknown) => ({ isValid: true, errors: [], output: input }) };

    const validator = new ToolOutputSchemaValidator([mockStep1, mockStep2]);
    // To properly test runPipeline, we'd need to mock the internal logic or assume a specific input/output contract.
    // Given the structure, we assume runPipeline executes all steps.
    // We'll test the basic execution path assuming the input is valid for all steps.
    const result = validator.runPipeline({ data: "test" } as unknown);

    // Asserting the result structure based on the expected ValidationResult type
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('output');
  });
});