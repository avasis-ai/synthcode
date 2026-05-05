import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV37 } from "../src/validation/structured-thought-step-validator-v37";

describe("StructuredThoughtStepValidatorV37", () => {
  const validator = new StructuredThoughtStepValidatorV37();

  it("should return isValid true for a valid sequence of steps", () => {
    const steps = [
      { input: { a: 1 }, output: { b: 2 } },
      { input: { c: 3 }, output: { d: 4 } },
    ];
    const schema = [
      { inputSchema: { a: "number" }, outputSchema: { b: "number" } },
      { inputSchema: { c: "number" }, outputSchema: { d: "number" } },
    ];
    const result = validator.validateSequence(steps, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid false and errors for an invalid step input", () => {
    const steps = [
      { input: { a: "not a number" }, output: { b: 2 } },
    ];
    const schema = [
      { inputSchema: { a: "number" }, outputSchema: { b: "number" } },
    ];
    const result = validator.validateSequence(steps, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step 1: Input validation failed for 'a'. Expected type 'number', got 'string'.");
  });

  it("should return isValid false and errors for an invalid step output", () => {
    const steps = [
      { input: { a: 1 }, output: { b: "not a number" } },
    ];
    const schema = [
      { inputSchema: { a: "number" }, outputSchema: { b: "number" } },
    ];
    const result = validator.validateSequence(steps, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step 1: Output validation failed for 'b'. Expected type 'number', got 'string'.");
  });
});