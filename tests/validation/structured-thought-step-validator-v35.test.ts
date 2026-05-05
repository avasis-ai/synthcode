import { describe, it, expect } from "vitest";
import { CrossStepValidator } from "../src/validation/structured-thought-step-validator-v35";

describe("CrossStepValidator", () => {
  it("should return isValid: true when previous and current steps are valid and consistent", () => {
    const validator = new CrossStepValidator();
    const previousStep = {
      id: "step1",
      input: { query: "test" },
      output: { result: "initial" },
      context: { data: "context1" },
    };
    const currentStep = {
      id: "step2",
      input: { previous_output: "initial" },
      output: { final_result: "success" },
      context: { data: "context2" },
    };
    const result = validator.validate(previousStep, currentStep);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("should return isValid: false and an error message when current step input is missing required data from previous step", () => {
    const validator = new CrossStepValidator();
    const previousStep = {
      id: "step1",
      input: { query: "test" },
      output: { result: "initial" },
      context: { data: "context1" },
    };
    const currentStep = {
      id: "step2",
      input: { missing_data: "value" }, // Missing 'previous_output' expected by the validator
      output: { final_result: "success" },
      context: { data: "context2" },
    };
    const result = validator.validate(previousStep, currentStep);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Input for current step is missing required data from previous step");
  });

  it("should return isValid: false when context data in current step contradicts previous step's context", () => {
    const validator = new CrossStepValidator();
    const previousStep = {
      id: "step1",
      input: { query: "test" },
      output: { result: "initial" },
      context: { data: "context1", user_id: "user123" },
    };
    const currentStep = {
      id: "step2",
      input: { previous_output: "initial" },
      output: { final_result: "success" },
      context: { data: "context2", user_id: "user456" }, // Contradiction in user_id
    };
    const result = validator.validate(previousStep, currentStep);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Context data contradiction detected for user_id");
  });
});