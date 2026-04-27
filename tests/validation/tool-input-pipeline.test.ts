import { describe, it, expect } from "vitest";
import { ToolInputPipeline, ValidationStep } from "../src/validation/tool-input-pipeline";

describe("ToolInputPipeline", () => {
  it("should return isValid false and accumulate errors if any step fails", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: false,
        result: null,
        error: "Error in step 1",
      }),
    };
    const mockStep2: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: false,
        result: null,
        error: "Error in step 2",
      }),
    };

    const pipeline = new ToolInputPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({ a: 1 }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Error in step 1");
    expect(result.errors).toContain("Error in step 2");
    expect(result.finalInput).toBeUndefined();
  });

  it("should return isValid true and the final input if all steps succeed", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: true,
        result: { processed: true, data: input },
      }),
    };
    const mockStep2: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: true,
        result: { final: true, data: input },
      }),
    };

    const pipeline = new ToolInputPipeline([mockStep1, mockStep2]);
    const result = pipeline.validate({ initial: "data" }, {});

    expect(result.isValid).toBe(true);
    expect(result.finalInput).toEqual({ final: true, data: { initial: "data" } });
    expect(result.errors).toHaveLength(0);
  });

  it("should stop processing and return partial results upon first failure", () => {
    const mockStep1: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: true,
        result: { step1_output: input },
      }),
    };
    const mockStep2: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: false,
        result: null,
        error: "Failure here",
      }),
    };
    const mockStep3: ValidationStep = {
      validate: (input: any, context: any) => ({
        isValid: true, // Should not be reached
        result: { step3_output: input },
      }),
    };

    const pipeline = new ToolInputPipeline([mockStep1, mockStep2, mockStep3]);
    const result = pipeline.validate({ initial: "data" }, {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe("Failure here");
    // The final input should reflect the state *before* the failing step, or the last successful state.
    // Based on the implementation logic (which we assume accumulates state), it should reflect the last valid state.
    expect(result.finalInput).toEqual({ step1_output: { initial: "data" } });
  });
});