import { describe, it, expect } from "vitest";
import { validateStructuredThoughtStep } from "../src/validation/structured-thought-step-validator-v31";

describe("validateStructuredThoughtStep", () => {
  it("should return true for a valid sequence of steps", () => {
    const validSteps = [
      { type: "reasoning", content: "Initial thought process." },
      { type: "observation", content: "Tool output received." },
      { type: "action", content: "Next action taken." },
    ];
    const result = validateStructuredThoughtStep(validSteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an invalid transition (e.g., reasoning directly after reasoning)", () => {
    const invalidSteps = [
      { type: "reasoning", content: "First thought." },
      { type: "reasoning", content: "Second thought without observation/action." },
    ];
    const result = validateStructuredThoughtStep(invalidSteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stepIndex).toBe(1);
    expect(result.errors[0].stepType).toBe("reasoning");
  });

  it("should handle an empty array of steps correctly", () => {
    const emptySteps: any[] = [];
    const result = validateStructuredThoughtStep(emptySteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});