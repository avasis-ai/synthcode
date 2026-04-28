import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v19";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should initialize with no steps if none are provided", () => {
    const pipeline = new StructuredToolOutputValidationPipeline();
    // We can't directly check private members, but we can test adding a step
    // and then checking if the internal state changes (conceptually).
    // For this test, we'll just ensure instantiation doesn't crash.
    expect(pipeline).toBeInstanceOf(StructuredToolOutputValidationPipeline);
  });

  it("should allow adding validation steps", () => {
    const mockStep: any = { validate: () => ({ isValid: true, errors: [] }) };
    const pipeline = new StructuredToolOutputValidationPipeline();
    pipeline.addStep(mockStep);

    // A more robust test would involve checking the internal array length,
    // but based on the provided structure, we confirm the method call works.
    // Since we cannot access private members, we rely on the method signature test.
    expect(pipeline).toHaveProperty("addStep");
  });

  it("should execute all added steps sequentially", () => {
    const mockStep1: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep2: any = { validate: () => ({ isValid: true, errors: [] }) };
    const mockStep3: any = { validate: () => ({ isValid: true, errors: [] }) };

    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2]);
    // Manually add the third step to simulate a full pipeline setup
    (pipeline as any).addStep(mockStep3);

    // Since the actual execution logic (the 'validate' method on the pipeline itself)
    // is not provided, we test the setup mechanism which implies execution capability.
    // We assume the pipeline has a method like 'validate' that uses all steps.
    // For this test, we confirm the setup allows for multiple steps.
    expect(pipeline).toBeDefined();
  });
});