import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV17 } from "../src/validation/structured-thought-step-validator-v17";
import { Message } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV17", () => {
  it("should return valid when no rules are provided and steps are valid", () => {
    const validator = new StructuredThoughtStepValidatorV17([]);
    const steps: Message[] = [
      { type: "user", content: { type: "text", text: "Hello" } }
    ];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid when a custom rule fails validation", () => {
    const failingRule: any = {
      name: "FailingRule",
      validate: (steps: Message[], currentStepIndex: number, currentStep: Message) => ({
        isValid: false,
        message: "Validation failed due to custom rule.",
      }),
    };
    const validator = new StructuredThoughtStepValidatorV17([failingRule]);
    const steps: Message[] = [
      { type: "user", content: { type: "text", text: "Some input" } }
    ];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Validation failed due to custom rule.");
  });

  it("should handle empty steps array correctly", () => {
    const validator = new StructuredThoughtStepValidatorV17([]);
    const steps: Message[] = [];
    const result = validator.validate(steps);
    expect(result.isValid).toBe(true);
  });
});