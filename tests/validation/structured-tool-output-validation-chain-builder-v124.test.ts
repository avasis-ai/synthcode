import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder-v124";

describe("StructuredToolOutputValidationChainBuilder", () => {
  it("should build a validation chain correctly with multiple steps", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    const step1 = { execute: (output) => ({ isValid: true, errors: [] }) };
    const step2 = { execute: (output) => ({ isValid: true, errors: [] }) };

    builder.addStep(step1);
    builder.addStep(step2);

    const chain = builder.build();
    expect(chain).toBeInstanceOf(Array);
    expect(chain.length).toBe(2);
  });

  it("should return an empty chain if no steps are added", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    const chain = builder.build();
    expect(chain).toEqual([]);
  });

  it("should execute all added steps and aggregate errors", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    const step1 = { execute: (output) => ({ isValid: true, errors: [] }) };
    const step2 = { execute: (output) => ({ isValid: false, errors: ["Error in step 2"] }) };
    const step3 = { execute: (output) => ({ isValid: false, errors: ["Error in step 3"] }) };

    builder.addStep(step1);
    builder.addStep(step2);
    builder.addStep(step3);

    const chain = builder.build();
    const result = chain.reduce((acc, step) => {
      const validationResult = step.execute({});
      return { isValid: acc.isValid && validationResult.isValid, errors: [...acc.errors, ...validationResult.errors] };
    }, { isValid: true, errors: [] });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in step 2", "Error in step 3"]);
  });
});