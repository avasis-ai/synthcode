import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidator } from "../src/validation/structured-thought-step-validator-v39";

describe("StructuredThoughtStepValidator", () => {
  it("should validate two consecutive steps correctly when data flows as expected", () => {
    const validator = new StructuredThoughtStepValidator();
    const step1: any = { stepId: "step1", input: { context: "initial" }, output: { result: "intermediate_result" } };
    const step2: any = { stepId: "step2", input: { context: "initial" }, output: { final_output: "final" } };

    const result = validator.validateCrossStep(step1, step2);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("should fail validation when the output of the first step is missing required data for the second step", () => {
    const validator = new StructuredThoughtStepValidator();
    const step1: any = { stepId: "step1", input: { context: "initial" }, output: {} }; // Missing output
    const step2: any = { stepId: "step2", input: { context: "initial" }, output: { final_output: "final" } };

    const result = validator.validateCrossStep(step1, step2);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Output of step1 is empty");
  });

  it("should pass validation when steps are identical and valid", () => {
    const validator = new StructuredThoughtStepValidator();
    const step: any = { stepId: "stepA", input: { data: 1 }, output: { data: 2 } };

    const result = validator.validateCrossStep(step, step);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});