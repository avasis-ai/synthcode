import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorAdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v31-advanced-advanced";
import { Message } from "../src/validation/types";

describe("StructuredThoughtStepValidatorAdvancedAdvanced", () => {
  it("should validate a single valid thought step", () => {
    const validator = new StructuredThoughtStepValidatorAdvancedAdvanced("Thought:");
    const validStep: Message = {
      role: "user",
      content: {
        type: "text",
        text: "This is a thought step.",
      },
    };
    const result = validator.validateStep(validStep, 0, [validStep]);
    expect(result.isValid).toBe(true);
  });

  it("should fail validation if the required thinking block prefix is missing in a step", () => {
    const validator = new StructuredThoughtStepValidatorAdvancedAdvanced("Thought:");
    const invalidStep: Message = {
      role: "user",
      content: {
        type: "text",
        text: "This step is missing the required prefix.",
      },
    };
    const result = validator.validateStep(invalidStep, 0, [invalidStep]);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("must start with \"Thought:\"");
  });

  it("should validate a sequence of multiple steps correctly", () => {
    const validator = new StructuredThoughtStepValidatorAdvancedAdvanced("Thought:");
    const validSteps: Message[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: "Thought: First thought.",
        },
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Thought: Second thought.",
        },
      },
    ];
    const result = validator.validateSequence(validSteps);
    expect(result.isValid).toBe(true);
  });
});