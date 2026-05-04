import { describe, it, expect } from "vitest";
import { StepValidator, ValidatorRule } from "../src/validation/structured-thought-step-validator-v4";

describe("StepValidator", () => {
  it("should return valid when current and previous steps are valid", () => {
    const validator = new StepValidator();
    const currentStep = { type: "thought", content: "Thought content" };
    const previousStep = { type: "thought", content: "Previous thought" };
    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid when current step is missing type", () => {
    const validator = new StepValidator();
    const currentStep = { type: "", content: "Invalid step" };
    const previousStep = { type: "thought", content: "Previous thought" };
    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(false);
  });

  it("should return invalid when previous step is missing type", () => {
    const validator = new StepValidator();
    const currentStep = { type: "thought", content: "Valid step" };
    const previousStep = { type: "", content: "Invalid previous step" };
    const result = validator.validate(currentStep, previousStep);
    expect(result.isValid).toBe(false);
  });
});