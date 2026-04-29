import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationChainBuilder } from "../src/validation/structured-tool-input-validation-chain-builder";

describe("StructuredToolInputValidationChainBuilder", () => {
  it("should allow chaining of validation steps", () => {
    const builder = new StructuredToolInputValidationChainBuilder();
    const step1: ValidationStep = (input) => ({ isValid: true, errors: [], data: { ...input, step1Passed: true } });
    const step2: ValidationStep = (input) => ({ isValid: true, errors: [], data: { ...input, step2Passed: true } });

    (builder as any).addStep(step1);
    (builder as any).addStep(step2);

    const result = (builder as any).build(
      { a: 1, b: "test" }
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual({ a: 1, b: "test", step1Passed: true, step2Passed: true });
  });

  it("should aggregate errors from multiple validation steps", () => {
    const builder = new StructuredToolInputValidationChainBuilder();
    const step1: ValidationStep = (input) => ({ isValid: input.a === 1, errors: input.a !== 1 ? ["'a' must be 1"] : [], data: input });
    const step2: ValidationStep = (input) => ({ isValid: input.b.length > 3, errors: input.b.length <= 3 ? ["'b' must be longer than 3"] : [], data: input });

    (builder as any).addStep(step1);
    (builder as any).addStep(step2);

    const result = (builder as any).build(
      { a: 0, b: "short" }
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["'a' must be 1", "'b' must be longer than 3"]);
    expect(result.data).toEqual({ a: 0, b: "short" });
  });

  it("should return the original data if no steps are added", () => {
    const builder = new StructuredToolInputValidationChainBuilder();
    const initialData = { key: "value" };

    const result = (builder as any).build(initialData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toEqual(initialData);
  });
});