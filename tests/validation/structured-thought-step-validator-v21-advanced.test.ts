import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV21Advanced } from "../src/validation/structured-thought-step-validator-v21-advanced";
import { StructuredThoughtStep } from "../src/validation/structured-thought-step";

describe("StructuredThoughtStepValidatorV21Advanced", () => {
  it("should initialize correctly", () => {
    const validator = new StructuredThoughtStepValidatorV21Advanced();
    expect(validator).toBeDefined();
    expect(validator.getName()).toBe("structured-thought-step-validator-v21-advanced");
  });

  it("should validate a valid structured thought step", () => {
    const validator = new StructuredThoughtStepValidatorV21Advanced();
    const validStep: StructuredThoughtStep = {
      id: "step1",
      thought: "This is a valid thought.",
      action: "action_name",
      details: {
        input: "some input",
        output: "some output",
      },
      isFinal: true,
    };
    // Assuming the validator has a method like validate that takes the step and context
    // Since the actual validation logic isn't provided, we test the structure and assume a successful validation path.
    // We'll mock the expected behavior for testing purposes.
    const result = validator.validate(validStep, []);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("should fail validation for a step missing required fields", () => {
    const validator = new StructuredThoughtStepValidatorV21Advanced();
    const invalidStep: StructuredThoughtStep = {
      id: "", // Missing ID
      thought: "Missing thought",
      action: null as any, // Invalid action type
      details: undefined as any, // Missing details
      isFinal: false,
    };
    const result = validator.validate(invalidStep, []);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Validation failed"); // Expecting a generic failure message or specific error
  });
});