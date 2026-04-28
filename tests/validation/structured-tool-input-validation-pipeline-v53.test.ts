import { describe, it, expect } from "vitest";
import { TemporalDependencyStep } from "../src/validation/structured-tool-input-validation-pipeline-v53";

describe("TemporalDependencyStep", () => {
  it("should return valid when the dependent field is present and valid", () => {
    const step = new TemporalDependencyStep("dependentField");
    const input: Record<string, unknown> = {
      dependentField: "someValue",
      otherField: "someOtherValue",
    };
    const context: Record<string, unknown> = {};
    const result = step.execute(input, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when the dependent field is missing", () => {
    const step = new TemporalDependencyStep("missingField");
    const input: Record<string, unknown> = {
      otherField: "someValue",
    };
    const context: Record<string, unknown> = {};
    const result = step.execute(input, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: missingField");
  });

  it("should return invalid when the dependent field is present but invalid (e.g., null)", () => {
    const step = new TemporalDependencyStep("nullableField");
    const input: Record<string, unknown> = {
      nullableField: null,
      otherField: "someValue",
    };
    const context: Record<string, unknown> = {};
    const result = step.execute(input, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Field 'nullableField' cannot be null.");
  });
});