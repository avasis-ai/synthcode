import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV20 } from "../src/validation/structured-thought-step-validator-v20";

describe("StructuredThoughtStepValidatorV20", () => {
  it("should return valid when provided with a correctly structured thought step", () => {
    const validator = new StructuredThoughtStepValidatorV20();
    const validStep = {
      step_id: "step1",
      content: "This is a valid thought process.",
      causality_links: [],
    };
    const result = validator.validate(validStep);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with an error if step_id is missing", () => {
    const validator = new StructuredThoughtStepValidatorV20();
    const invalidStep = {
      step_id: "", // Empty string simulating missing ID check
      content: "Content without ID context.",
      causality_links: [],
    };
    const result = validator.validate(invalidStep);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("step_id must be a non-empty string.");
  });

  it("should return invalid with an error if causality_links contain invalid link types", () => {
    const validator = new StructuredThoughtStepValidatorV20();
    const invalidStep = {
      step_id: "step2",
      content: "Content with bad links.",
      causality_links: [
        {
          source_step_id: "step1",
          target_step_id: "step2",
          link_type: "unknown_type", // Invalid type
        },
      ],
    };
    const result = validator.validate(invalidStep);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid link_type found in causality_links.");
  });
});