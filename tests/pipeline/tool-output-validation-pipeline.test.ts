import { describe, it, expect } from "vitest";
import { ToolOutputValidationPipeline, Validator } from "../src/pipeline/tool-output-validation-pipeline";

describe("ToolOutputValidationPipeline", () => {
  it("should return valid if all validators pass", async () => {
    const mockValidator1: Validator = {
      validate: async (input: any) => ({ isValid: true, output: { step1: input } }),
    };
    const mockValidator2: Validator = {
      validate: async (input: any) => ({ isValid: true, output: { step2: input } }),
    };

    const pipeline = new ToolOutputValidationPipeline([mockValidator1, mockValidator2]);
    const result = await pipeline.run({ initial: true });

    expect(result.isValid).toBe(true);
    expect(result.output).toEqual({ step2: { step1: { initial: true } } });
    expect(result.error).toBeUndefined();
  });

  it("should return invalid and stop on the first failing validator", async () => {
    const mockValidator1: Validator = {
      validate: async (input: any) => ({ isValid: true, output: { step1: input } }),
    };
    const mockValidator2: Validator = {
      validate: async (input: any) => ({ isValid: false, output: null, error: "Validation failed at step 2" }),
    };
    const mockValidator3: Validator = {
      validate: async (input: any) => ({ isValid: true, output: { step3: input } }), // Should not be called
    };

    const pipeline = new ToolOutputValidationPipeline([mockValidator1, mockValidator2, mockValidator3]);
    const result = await pipeline.run({ initial: true });

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Validation failed at step 2");
    // Check that the output reflects the state after the failure (or the last successful state, depending on implementation, but here we check for the failure state)
    expect(result.output).toBeNull();
  });

  it("should return valid if no validators are provided", async () => {
    const pipeline = new ToolOutputValidationPipeline([]);
    const result = await pipeline.run({ initial: true });

    expect(result.isValid).toBe(true);
    expect(result.output).toEqual({ initial: true });
    expect(result.error).toBeUndefined();
  });
});