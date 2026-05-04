import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV13 } from "../src/validation/structured-thought-step-validator-v13";
import { ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV13", () => {
  it("should return valid when all steps are valid", () => {
    const mockValidator = new StructuredThoughtStepValidatorV13([]);
    const validSteps: ThinkingBlock[] = [
      { id: "step1", thought: "First thought", action: null },
      { id: "step2", thought: "Second thought", action: null },
    ];
    const result = mockValidator.validate(validSteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should collect all validation errors when multiple steps are invalid", () => {
    // Mocking a validator that always fails for demonstration
    const mockValidator = new StructuredThoughtStepValidatorV13([
      (prev, current) => ({ isValid: false, message: `Error in ${current.id}` }),
    ]);
    const invalidSteps: ThinkingBlock[] = [
      { id: "step1", thought: "Thought 1", action: null },
      { id: "step2", thought: "Thought 2", action: null },
    ];
    const result = mockValidator.validate(invalidSteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Error in step1");
    expect(result.errors).toContain("Error in step2");
  });

  it("should handle an empty array of thought steps gracefully", () => {
    const mockValidator = new StructuredThoughtStepValidatorV13([]);
    const emptySteps: ThinkingBlock[] = [];
    const result = mockValidator.validate(emptySteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});