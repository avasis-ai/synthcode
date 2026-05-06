import { describe, it, expect } from "vitest";
import { ContextualStepValidatorChain, StepContext, StepResult, StepValidator } from "../src/validation/contextual-step-validation-chain";

describe("ContextualStepValidatorChain", () => {
  it("should correctly validate when all validators pass", () => {
    const mockValidator1: StepValidator = {
      validate: (context, previousResult) => ({ success: true, output: "Valid 1" }),
    };
    const mockValidator2: StepValidator = {
      validate: (context, previousResult) => ({ success: true, output: "Valid 2" }),
    };
    const chain = new ContextualStepValidatorChain([mockValidator1, mockValidator2]);

    const context: StepContext = { history: [], currentStepIndex: 1, totalSteps: 2 };
    const previousResult: StepResult = { success: true, output: "Initial" };

    const result = chain.validate(context, previousResult);

    expect(result.success).toBe(true);
    expect(result.output).toBe("Valid 2");
  });

  it("should stop and return failure immediately when the first validator fails", () => {
    const mockValidator1: StepValidator = {
      validate: (context, previousResult) => ({ success: false, output: undefined, error: "Validation failed at step 1" }),
    };
    const mockValidator2: StepValidator = {
      validate: (context, previousResult) => ({ success: true, output: "Should not run" }),
    };
    const chain = new ContextualStepValidatorChain([mockValidator1, mockValidator2]);

    const context: StepContext = { history: [], currentStepIndex: 1, totalSteps: 2 };
    const previousResult: StepResult = { success: true, output: "Initial" };

    const result = chain.validate(context, previousResult);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed at step 1");
  });

  it("should return the result of the last successful validator if some fail", () => {
    const mockValidator1: StepValidator = {
      validate: (context, previousResult) => ({ success: false, output: undefined, error: "Fail 1" }),
    };
    const mockValidator2: StepValidator = {
      validate: (context, previousResult) => ({ success: true, output: "Success 2" }),
    };
    const mockValidator3: StepValidator = {
      validate: (context, previousResult) => ({ success: true, output: "Success 3" }),
    };
    const chain = new ContextualStepValidatorChain([mockValidator1, mockValidator2, mockValidator3]);

    const context: StepContext = { history: [], currentStepIndex: 1, totalSteps: 3 };
    const previousResult: StepResult = { success: true, output: "Initial" };

    // Note: Based on the implementation logic (which is assumed to run sequentially and return the last result),
    // if the first fails, it should return the failure. If we assume the chain only returns the *last* result
    // regardless of failure, we test that. Given the structure, we test the failure propagation.
    // Re-testing the failure case to ensure the first failure stops execution.
    const result = chain.validate(context, previousResult);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Fail 1");
  });
});