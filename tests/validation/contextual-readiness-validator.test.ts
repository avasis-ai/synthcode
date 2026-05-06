import { describe, it, expect } from "vitest";
import { ContextualReadinessValidator } from "../src/validation/contextual-readiness-validator";

describe("ContextualReadinessValidator", () => {
  it("should mark as ready when all required tool inputs are present", () => {
    const requiredInputs = {
      "toolA": ["param1", "param2"],
      "toolB": ["param3"],
    };
    const validator = new ContextualReadinessValidator(requiredInputs);
    const report = validator.validate(
      {
        toolA: { inputs: ["param1", "param2"] },
        toolB: { inputs: ["param3"] },
      }
    );
    expect(report.isReady).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it("should report issues when some required tool inputs are missing", () => {
    const requiredInputs = {
      "toolA": ["param1", "param2"],
      "toolB": ["param3"],
    };
    const validator = new ContextualReadinessValidator(requiredInputs);
    const context = {
      toolA: { inputs: ["param1"] }, // Missing param2
      toolB: { inputs: [] }, // Missing param3
    };
    const report = validator.validate(context);
    expect(report.isReady).toBe(false);
    expect(report.issues).toHaveLength(2);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        {
          severity: "warning",
          message: "Missing required input for toolA",
          context: "param2",
        },
        {
          severity: "warning",
          message: "Missing required input for toolB",
          context: "param3",
        },
      ])
    );
  });

  it("should handle empty required inputs gracefully", () => {
    const requiredInputs: Record<string, string[]> = {};
    const validator = new ContextualReadinessValidator(requiredInputs);
    const context = {};
    const report = validator.validate(context);
    expect(report.isReady).toBe(true);
    expect(report.issues).toHaveLength(0);
  });
});