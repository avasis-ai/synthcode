import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV25 } from "../src/validation/structured-thought-step-validator-v25";

describe("StructuredThoughtStepValidatorV25", () => {
  it("should return valid when provided with a valid array of thought steps", () => {
    const validator = new StructuredThoughtStepValidatorV25();
    const validSteps: any[] = [
      {
        id: "step1",
        stepIndex: 0,
        content: [{ type: "text", content: "Initial thought." }],
      },
      {
        id: "step2",
        stepIndex: 1,
        content: [{ type: "text", content: "Follow up thought." }],
        referencesStepId: "step1",
        reasoning: "Reasoning for step 2.",
      },
    ];
    const result = validator.validate(validSteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid and list errors for missing or empty steps array", () => {
    const validator = new StructuredThoughtStepValidatorV25();
    const result = validator.validate(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input steps array cannot be null or undefined.");

    const resultEmpty = validator.validate([]);
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.errors).toContain("Input steps array cannot be null or undefined.");
  });

  it("should return invalid if a step is missing required fields like id or stepIndex", () => {
    const validator = new StructuredThoughtStepValidatorV25();
    const invalidSteps: any[] = [
      {
        id: "step1",
        stepIndex: 0,
        content: [{ type: "text", content: "Valid step." }],
      },
      {
        // Missing id
        stepIndex: 1,
        content: [{ type: "text", content: "Invalid step." }],
      },
    ];
    const result = validator.validate(invalidSteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step at index 1 is missing required field: id.");
  });
});