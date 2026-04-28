import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipeline } from "../src/validation/structured-tool-output-validation-pipeline-v51";

describe("StructuredToolOutputValidationPipeline", () => {
  it("should initialize correctly with an empty array of steps", () => {
    const pipeline = new StructuredToolOutputValidationPipeline([]);
    // We can't directly test private members, but we can test its behavior
    // by running it with an empty set of steps.
    const result = pipeline.run({}, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should run all provided validation steps sequentially", () => {
    const mockStep1: StructuredToolOutputValidationStep = {
      name: "step1",
      validate: (output, context) => ({ isValid: true, errors: [], resolvedOutput: { data: "step1_ok" } }),
    };
    const mockStep2: StructuredToolOutputValidationStep = {
      name: "step2",
      validate: (output, context) => ({ isValid: true, errors: [], resolvedOutput: { data: "step2_ok" } }),
    };

    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2]);
    const initialOutput = { input: "test" };
    const context = { user: "test_user" };

    const result = pipeline.run(initialOutput, context);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    // Check if the output was resolved by the last step
    expect(result.resolvedOutput).toEqual({ data: "step2_ok" });
  });

  it("should stop and report failure if any step fails validation", () => {
    const mockStep1: StructuredToolOutputValidationStep = {
      name: "step1",
      validate: (output, context) => ({ isValid: true, errors: [], resolvedOutput: { data: "step1_ok" } }),
    };
    const mockStep2: StructuredToolOutputValidationStep = {
      name: "step2_fail",
      validate: (output, context) => ({ isValid: false, errors: ["Validation failed in step 2"], resolvedOutput: undefined }),
    };
    const mockStep3: StructuredToolOutputValidationStep = {
      name: "step3",
      validate: (output, context) => ({ isValid: true, errors: [], resolvedOutput: { data: "step3_ok" } }),
    };

    const pipeline = new StructuredToolOutputValidationPipeline([mockStep1, mockStep2, mockStep3]);
    const initialOutput = {};
    const context = {};

    const result = pipeline.run(initialOutput, context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Validation failed in step 2"]);
    // The output should reflect the state before the failing step, or be undefined/initial
    expect(result.resolvedOutput).toBeUndefined();
  });
});