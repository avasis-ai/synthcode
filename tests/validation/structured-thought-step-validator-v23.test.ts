import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV23 } from "../src/validation/structured-thought-step-validator-v23";

describe("StructuredThoughtStepValidatorV23", () => {
  const validator = new StructuredThoughtStepValidatorV23();
  const mockContext: any = { history: [] };

  it("should return valid when provided with an empty array of steps", () => {
    const steps: any[] = [];
    const result = validator.validate(steps, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an invalid step structure and report errors", () => {
    // Simulate a step missing required fields or having incorrect types
    const invalidSteps: any[] = [
      { type: "thought", content: "This is a thought step." }, // Missing required fields if any
      { type: "tool_use", content: "Tool use data" } // Potentially malformed
    ];
    const result = validator.validate(invalidSteps, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1); // Adjust expected length based on actual validation logic
  });

  it("should pass validation for a sequence of correctly structured steps", () => {
    // Simulate a valid sequence of steps
    const validSteps: any[] = [
      { type: "thought", content: "Initial thought process." },
      { type: "tool_use", content: "Tool call details", tool_name: "search" },
      { type: "text", content: "Final response text." }
    ];
    const result = validator.validate(validSteps, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});