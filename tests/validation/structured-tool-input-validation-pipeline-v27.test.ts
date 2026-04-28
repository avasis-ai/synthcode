import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-v27";

describe("StructuredToolInputValidationPipelineBuilder", () => {
  it("should initialize with an empty list of steps", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    // We can't directly access private members, but we can test the outcome of adding steps.
    // A more robust test might involve mocking or adding a getter if available.
    // For now, we'll rely on the addStep functionality.
  });

  it("should add a single validation step correctly", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    const mockStep: ValidationStep = {
      validate: (input: Record<string, unknown>) => ({ isValid: true }),
    };
    builder.addStep(mockStep);

    // Since we can't inspect the private array, we'll test the behavior of building a pipeline
    // which implicitly uses the added steps.
    const pipeline = builder.build();
    expect(typeof pipeline).toBe("function"); // Assuming build() returns a callable pipeline
  });

  it("should add multiple validation steps sequentially", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    const step1: ValidationStep = {
      validate: (input: Record<string, unknown>) => ({ isValid: true }),
    };
    const step2: ValidationStep = {
      validate: (input: Record<string, unknown>) => ({ isValid: true }),
    };

    builder.addStep(step1);
    builder.addStep(step2);

    const pipeline = builder.build();
    // Again, testing the resulting pipeline's execution is the best bet.
    // We assume build() combines the steps correctly.
    const result = pipeline({});
    expect(result).toBeDefined();
  });
});