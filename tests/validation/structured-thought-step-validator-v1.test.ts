import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidator } from "../src/validation/structured-thought-step-validator-v1";

describe("StructuredThoughtStepValidator", () => {
  it("should return valid result for a correctly structured thought step", () => {
    const validStep: any = {
      reasoning: "I think this is the correct next step.",
      evidence: ["evidence1", "evidence2"],
      nextStep: {
        action: "continue",
        details: "Proceed to the next part of the process.",
      },
    };
    const validator = new StructuredThoughtStepValidator();
    const result = validator.validate(validStep);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("should report errors for missing reasoning", () => {
    const invalidStep: any = {
      reasoning: "", // Missing or empty reasoning
      evidence: ["evidence1"],
      nextStep: {
        action: "finish",
        details: "Finished.",
      },
    };
    const validator = new StructuredThoughtStepValidator();
    const result = validator.validate(invalidStep);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty("reasoning");
    expect(result.errors["reasoning"]).toContain("Reasoning cannot be empty.");
  });

  it("should report errors for invalid nextStep action", () => {
    const invalidStep: any = {
      reasoning: "Some reasoning.",
      evidence: [],
      nextStep: {
        action: "invalid_action", // Invalid action
        details: "Something went wrong.",
      },
    };
    const validator = new StructuredThoughtStepValidator();
    const result = validator.validate(invalidStep);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty("nextStep.action");
    expect(result.errors["nextStep.action"]).toContain("Invalid action specified. Must be 'continue', 'finish', or 'tool_call'.");
  });
});