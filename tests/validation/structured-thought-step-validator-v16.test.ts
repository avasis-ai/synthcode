import { describe, it, expect } from "vitest";
import { validateStructuredThoughtStep } from "../src/validation/structured-thought-step-validator-v16";

describe("validateStructuredThoughtStep", () => {
  it("should return true for a valid goal_analysis step", () => {
    const validStep = {
      step_type: "goal_analysis",
      content: {
        goal: "Analyze the user request.",
        keywords: ["user", "request"],
      },
    };
    expect(validateStructuredThoughtStep(validStep)).toBe(true);
  });

  it("should return false for an invalid step_type", () => {
    const invalidStep = {
      step_type: "unknown_type",
      content: {
        data: "some data",
      },
    };
    expect(validateStructuredThoughtStep(invalidStep)).toBe(false);
  });

  it("should return false if content is missing required fields for a planning step", () => {
    const invalidStep = {
      step_type: "planning",
      content: {
        // Missing required fields for planning
        steps: [],
      },
    };
    expect(validateStructuredThoughtStep(invalidStep)).toBe(false);
  });
});