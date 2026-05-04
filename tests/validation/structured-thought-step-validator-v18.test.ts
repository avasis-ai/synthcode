import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV18 } from "../src/validation/structured-thought-step-validator-v18";

describe("StructuredThoughtStepValidatorV18", () => {
  it("should return false if currentStep or previousStep is missing", () => {
    const validator = new StructuredThoughtStepValidatorV18();
    const contextMissingCurrent = { currentStep: undefined, previousStep: {} };
    const contextMissingPrevious = { currentStep: {}, previousStep: undefined };

    const result1 = validator.validate(contextMissingCurrent);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain("Missing current or previous step context.");

    const result2 = validator.validate(contextMissingPrevious);
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain("Missing current or previous step context.");
  });

  it("should validate correctly when both steps are present and valid", () => {
    const validator = new StructuredThoughtStepValidatorV18();
    const validContext = {
      currentStep: { type: "thought", content: "Thinking content" },
      previousStep: { type: "message", content: "Previous message" },
    };
    // Assuming the validator passes if basic structure is present for this test scope
    const result = validator.validate(validContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should report errors for structural inconsistencies between steps", () => {
    const validator = new StructuredThoughtStepValidatorV18();
    // Simulate a case where the current step type is invalid relative to the previous step
    const invalidContext = {
      currentStep: { type: "unknown_type", content: "Bad step" },
      previousStep: { type: "thought", content: "Good thought" },
    };
    // This test relies on the internal logic of the validator for specific error messages
    const result = validator.validate(invalidContext);
    expect(result.isValid).toBe(false);
    // We expect at least one error related to structure if the type is unknown
    expect(result.errors).toContainEqual(expect.stringContaining("Invalid step type"));
  });
});