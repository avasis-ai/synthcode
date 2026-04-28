import { describe, it, expect } from "vitest";
import { ToolOutputValidationChainExecutor, ValidationStep } from "../src/validation/tool-output-validation-chain-executor";

describe("ToolOutputValidationChainExecutor", () => {
  it("should return the initial result if no steps are provided", () => {
    const executor = new ToolOutputValidationChainExecutor([]);
    const result = executor.execute({} as any);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({});
  });

  it("should execute all steps sequentially and pass data from one step to the next", () => {
    const mockStep1: ValidationStep = {
      execute: (input: any) => ({
        isValid: true,
        errors: [],
        data: { processed: input.originalData, step1Result: "ok" },
      }),
    };
    const mockStep2: ValidationStep = {
      execute: (input: any) => ({
        isValid: true,
        errors: [],
        data: { ...input.data, step2Result: "ok" },
      }),
    };
    const executor = new ToolOutputValidationChainExecutor([mockStep1, mockStep2]);
    const initialInput = { originalData: "test" } as any;
    const result = executor.execute(initialInput);

    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      processed: "test",
      step1Result: "ok",
      step2Result: "ok",
    });
  });

  it("should stop execution and return the result if any step fails validation", () => {
    const mockStep1: ValidationStep = {
      execute: (input: any) => ({
        isValid: true,
        errors: [],
        data: { step1Data: "ok" },
      }),
    };
    const mockStep2: ValidationStep = {
      execute: (input: any) => ({
        isValid: false,
        errors: ["Step 2 failed validation"],
        data: null,
      }),
    };
    const mockStep3: ValidationStep = {
      execute: (input: any) => ({
        isValid: true,
        errors: [],
        data: { step3Data: "should not run" },
      }),
    };
    const executor = new ToolOutputValidationChainExecutor([mockStep1, mockStep2, mockStep3]);
    const initialInput = {} as any;
    const result = executor.execute(initialInput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Step 2 failed validation"]);
    // The data should reflect the state after the failing step (or the last successful state if implementation dictates)
    // Based on the provided partial code, it seems the data should be updated up to the failure point.
    expect(result.data).toEqual({ step1Data: "ok" });
  });
});