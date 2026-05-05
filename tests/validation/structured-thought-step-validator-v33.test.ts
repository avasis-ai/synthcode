import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidator } from "../src/validation/structured-thought-step-validator-v33";

describe("StructuredThoughtStepValidator", () => {
  it("should validate a sequence of steps correctly when all steps are valid", async () => {
    const validator = new StructuredThoughtStepValidator();
    const context: any = {
      previousStepOutput: "Initial output",
      globalContext: { user: "test_user" },
    };
    const steps = [
      { input: { type: "thought", content: "Step 1 thought" }, validator: (input: any, context: any) => ({ isValid: true, errors: [] }) },
      { input: { type: "tool_use", toolName: "search", args: {} }, validator: (input: any, context: any) => ({ isValid: true, errors: [] }) },
      { input: { type: "final_answer", content: "Final answer" }, validator: (input: any, context: any) => ({ isValid: true, errors: [] }) },
    ];
    const result = await validator.validateSequence(steps, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return false and collect errors when one step in the sequence is invalid", async () => {
    const validator = new StructuredThoughtStepValidator();
    const context: any = {
      previousStepOutput: "Initial output",
      globalContext: { user: "test_user" },
    };
    const steps = [
      { input: { type: "thought", content: "Valid step" }, validator: (input: any, context: any) => ({ isValid: true, errors: [] }) },
      { input: { type: "invalid_step" }, validator: (input: any, context: any) => ({ isValid: false, errors: ["Invalid step type detected"] }) },
      { input: { type: "final_answer", content: "Another step" }, validator: (input: any, context: any) => ({ isValid: true, errors: [] }) },
    ];
    const result = await validator.validateSequence(steps, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors).toContain("Invalid step type detected");
  });

  it("should handle an empty sequence of steps gracefully", async () => {
    const validator = new StructuredThoughtStepValidator();
    const context: any = {
      previousStepOutput: null,
      globalContext: {},
    };
    const steps: any[] = [];
    const result = await validator.validateSequence(steps, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});