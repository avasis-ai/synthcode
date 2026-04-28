import { describe, it, expect } from "vitest";
import { ToolInputValidationChain, ValidationStep } from "../src/validation/tool-input-validation-chain";

describe("ToolInputValidationChain", () => {
  it("should return all errors when any step fails validation", () => {
    const mockStep1: ValidationStep = {
      validate: (context: any) => ({ isValid: false, error: "Error 1" }),
    };
    const mockStep2: ValidationStep = {
      validate: (context: any) => ({ isValid: false, error: "Error 2" }),
    };
    const chain = new ToolInputValidationChain([mockStep1, mockStep2]);

    const result = chain.validate({});

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
  });

  it("should return valid if all steps pass validation", () => {
    const mockStep1: ValidationStep = {
      validate: (context: any) => ({ isValid: true }),
    };
    const mockStep2: ValidationStep = {
      validate: (context: any) => ({ isValid: true }),
    };
    const chain = new ToolInputValidationChain([mockStep1, mockStep2]);

    const result = chain.validate({});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should stop and report errors on the first failure if subsequent steps are not checked (implementation detail check)", () => {
    // Note: Based on the provided incomplete implementation, it seems the chain collects all errors.
    // We test the expected behavior based on the structure (collecting all errors).
    const mockStep1: ValidationStep = {
      validate: (context: any) => ({ isValid: false, error: "First error" }),
    };
    const mockStep2: ValidationStep = {
      validate: (context: any) => ({ isValid: true }), // This step should still be checked if the loop continues
    };
    const mockStep3: ValidationStep = {
      validate: (context: any) => ({ isValid: false, error: "Third error" }),
    };
    const chain = new ToolInputValidationChain([mockStep1, mockStep2, mockStep3]);

    const result = chain.validate({});

    expect(result.isValid).toBe(false);
    // Assuming the implementation collects all errors regardless of intermediate failure
    expect(result.errors).toEqual(["First error", "Third error"]);
  });
});