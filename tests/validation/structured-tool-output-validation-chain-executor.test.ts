import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainExecutor, ValidationStep, ValidationResult } from "../src/validation/structured-tool-output-validation-chain-executor";

describe("StructuredToolOutputValidationChainExecutor", () => {
  it("should return valid result if all steps pass", () => {
    const mockStep1: ValidationStep = (output) => ({ isValid: true, errors: [] });
    const mockStep2: ValidationStep = (output) => ({ isValid: true, errors: [] });
    const executor = new StructuredToolOutputValidationChainExecutor([mockStep1, mockStep2]);

    const result = executor.execute({ key: "value" });

    expect(result.finalResult.isValid).toBe(true);
    expect(result.finalResult.errors).toEqual([]);
  });

  it("should stop and return invalid result on the first failing step", () => {
    const mockStep1: ValidationStep = (output) => ({ isValid: true, errors: [] });
    const mockStep2: ValidationStep = (output) => ({ isValid: false, errors: ["Error in step 2"] });
    const mockStep3: ValidationStep = (output) => ({ isValid: true, errors: [] });
    const executor = new StructuredToolOutputValidationChainExecutor([mockStep1, mockStep2, mockStep3]);

    const result = executor.execute({ key: "value" });

    expect(result.finalResult.isValid).toBe(false);
    expect(result.finalResult.errors).toEqual(["Error in step 2"]);
  });

  it("should return the result of the last executed step if all steps pass", () => {
    const mockStep1: ValidationStep = (output) => ({ isValid: true, errors: ["Step 1 passed"] });
    const mockStep2: ValidationStep = (output) => ({ isValid: true, errors: ["Step 2 passed"] });
    const executor = new StructuredToolOutputValidationChainExecutor([mockStep1, mockStep2]);

    const result = executor.execute({ key: "value" });

    expect(result.finalResult.isValid).toBe(true);
    // The final result should reflect the last step's output if all are valid
    expect(result.finalResult.errors).toEqual(["Step 2 passed"]);
  });
});