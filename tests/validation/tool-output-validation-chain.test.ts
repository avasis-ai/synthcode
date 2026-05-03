import { describe, it, expect } from "vitest";
import { ToolOutputValidationChain } from "../src/validation/tool-output-validation-chain";

describe("ToolOutputValidationChain", () => {
  it("should return valid result if all steps pass", () => {
    const mockStep1: any = {
      validate: (output: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step1Passed: true },
      }),
    };
    const mockStep2: any = {
      validate: (output: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step2Passed: true },
      }),
    };
    const chain = ToolOutputValidationChain.create([mockStep1, mockStep2]);
    const result = chain.validate(
      { data: "test" },
      {}
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({
      step1Passed: true,
      step2Passed: true,
    });
  });

  it("should stop and report errors on the first failing step", () => {
    const mockStep1: any = {
      validate: (output: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step1Passed: true },
      }),
    };
    const mockStep2: any = {
      validate: (output: any, context: any) => ({
        isValid: false,
        errors: ["Step 2 failed validation"],
        context: { ...context, step2Failed: true },
      }),
    };
    const mockStep3: any = {
      validate: (output: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step3Passed: true },
      }),
    };
    const chain = ToolOutputValidationChain.create([mockStep1, mockStep2, mockStep3]);
    const result = chain.validate(
      { data: "test" },
      {}
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Step 2 failed validation"]);
    expect(result.context).toEqual({
      step1Passed: true,
      step2Failed: true,
    });
  });

  it("should return initial context if no steps are provided", () => {
    const chain = ToolOutputValidationChain.create([]);
    const result = chain.validate(
      { data: "test" },
      { initial: "context" }
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({ initial: "context" });
  });
});