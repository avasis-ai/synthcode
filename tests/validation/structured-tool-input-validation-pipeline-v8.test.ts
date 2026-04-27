import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV8 } from "../src/validation/structured-tool-input-validation-pipeline-v8";

describe("StructuredToolInputValidationPipelineV8", () => {
  it("should initialize with no steps", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV8();
    // We can't directly test private members, but we can test the outcome of adding steps.
    // For this test, we'll just ensure instantiation doesn't throw.
    expect(pipeline).toBeInstanceOf(StructuredToolInputValidationPipelineV8);
  });

  it("should execute added steps sequentially and aggregate results", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV8();
    const mockStep1: any = {
      execute: async (input: any) => ({ output: { step1: true }, errors: [] }),
    };
    const mockStep2: any = {
      execute: async (input: any) => ({ output: { step2: true }, errors: ["Error from step 2"] }),
    };

    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);

    const result = await pipeline.validate({ initial: true });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 2"]);
    expect(result.output).toEqual({ step1: { step1: true }, step2: { step2: true } });
  });

  it("should return valid if all steps pass", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV8();
    const mockStep1: any = {
      execute: async (input: any) => ({ output: { step1: true }, errors: [] }),
    };
    const mockStep2: any = {
      execute: async (input: any) => ({ output: { step2: true }, errors: [] }),
    };

    pipeline.addStep(mockStep1);
    pipeline.addStep(mockStep2);

    const result = await pipeline.validate({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.output).toEqual({ step1: { step1: true }, step2: { step2: true } });
  });
});