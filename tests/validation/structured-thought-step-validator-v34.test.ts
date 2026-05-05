import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV34 } from "../src/validation/structured-thought-step-validator-v34";

describe("StructuredThoughtStepValidatorV34", () => {
  it("should validate a simple valid thought step structure", () => {
    const validator = new StructuredThoughtStepValidatorV34();
    const validStep = {
      type: "thought",
      content: {
        blocks: [
          { type: "text", content: "This is a thought step." }
        ]
      }
    };
    const report = validator.validate(validStep);
    expect(report.isValid).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it("should report an error for missing required fields", () => {
    const validator = new StructuredThoughtStepValidatorV34();
    const invalidStep = {
      type: "thought",
      content: null // Missing content
    };
    const report = validator.validate(invalidStep);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain("Content is required for a thought step.");
  });

  it("should handle different step types correctly", () => {
    const validator = new StructuredThoughtStepValidatorV34();
    const toolUseStep = {
      type: "tool_use",
      content: {
        blocks: [{ type: "tool_use", tool_use: { name: "search", input: "test" } }]
      }
    };
    const report = validator.validate(toolUseStep);
    expect(report.isValid).toBe(true);
  });
});