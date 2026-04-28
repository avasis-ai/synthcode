import { describe, it, expect } from "vitest";
import { ValidatorChainExecutor } from "../src/validation/structured-tool-output-validation-chain-builder-v114";

describe("ValidatorChainExecutor", () => {
  it("should execute all steps successfully when all validations pass", () => {
    const step1: ValidatorStep = { validate: (output) => ({ isValid: true }) };
    const step2: ValidatorStep = { validate: (output) => ({ isValid: true }) };
    const failureCondition1: FailureCondition = {};
    const failureCondition2: FailureCondition = {};

    const executor = new ValidatorChainExecutor([
      { step: step1, failureCondition: failureCondition1 },
      { step: step2, failureCondition: failureCondition2 },
    ]);

    const result = executor.execute({ data: "test" });

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ data: "test" });
  });

  it("should stop execution and return failure details on the first validation failure", () => {
    const step1: ValidatorStep = { validate: (output) => ({ isValid: true }) };
    const step2: ValidatorStep = { validate: (output) => ({ isValid: false, error: "Invalid data" }) };
    const failureCondition1: FailureCondition = {};
    const failureCondition2: FailureCondition = { onFailure: (error) => ({ finalError: error }) };

    const executor = new ValidatorChainExecutor([
      { step: step1, failureCondition: failureCondition1 },
      { step: step2, failureCondition: failureCondition2 },
    ]);

    const result = executor.execute({ data: "test" });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toEqual({ finalError: "Invalid data" });
  });

  it("should execute subsequent steps if the failure condition handles the error and allows continuation", () => {
    const step1: ValidatorStep = { validate: (output) => ({ isValid: true }) };
    const step2: ValidatorStep = { validate: (output) => ({ isValid: true }) };
    const failureCondition1: FailureCondition = { onFailure: (error) => ({ allowed: true, processedError: error }) };
    const failureCondition2: FailureCondition = {};

    const executor = new ValidatorChainExecutor([
      { step: step1, failureCondition: failureCondition1 },
      { step: step2, failureCondition: failureCondition2 },
    ]);

    // Simulate a failure in step 1 that is handled and allows continuation
    const failingStep1: ValidatorStep = { validate: (output) => ({ isValid: false, error: "Transient error" }) };
    const executorWithRecovery = new ValidatorChainExecutor([
      { step: failingStep1, failureCondition: { onFailure: (error) => ({ allowed: true, processedError: error }) } },
      { step: step2, failureCondition: {} },
    ]);

    const result = executorWithRecovery.execute({ data: "test" });

    expect(result.success).toBe(true);
    expect(result.output).toEqual({ data: "test" });
  });
});