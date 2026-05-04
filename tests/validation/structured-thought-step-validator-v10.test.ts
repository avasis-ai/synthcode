import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV10 } from "../src/validation/structured-thought-step-validator-v10";
import { ThoughtStep } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV10", () => {
  const validator = new StructuredThoughtStepValidatorV10();
  const mockContext = {
    history: [
      { stepIndex: 0, message: { type: "user", content: { type: "text", text: "Initial prompt" } } },
    ],
    goal: "The user wants to validate a sequence of thought steps.",
  };

  it("should return valid when provided with a minimal, correct sequence", () => {
    const validSteps: ThoughtStep[] = [
      { stepIndex: 1, message: { type: "assistant", content: { type: "text", text: "Thinking step 1." } } },
    ];
    const result = validator.validate(validSteps, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an incorrect stepIndex sequence", () => {
    const invalidSteps: ThoughtStep[] = [
      { stepIndex: 1, message: { type: "assistant", content: { type: "text", text: "Step 1" } } },
      { stepIndex: 1, message: { type: "assistant", content: { type: "text", text: "Step 2 (Duplicate Index)" } } },
    ];
    const result = validator.validate(invalidSteps, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step index must be strictly increasing.");
  });

  it("should detect missing required fields in a step", () => {
    const incompleteSteps: ThoughtStep[] = [
      { stepIndex: 2, message: { type: "assistant", content: null } } // Missing text content structure
    ];
    const result = validator.validate(incompleteSteps, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Message content must be provided and structured correctly.");
  });
});