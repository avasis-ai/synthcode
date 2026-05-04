import { describe, it, expect } from "vitest";
import { Structu } from "../src/validation/structured-thought-step-validator-v3";

describe("StructuredThoughtStepValidator", () => {
  const validator = new Structu();

  it("should return isValid: true for a valid set of structured thought steps", () => {
    const validSteps: StructuredThoughtStep[] = [
      { type: "HYPOTHESIS", content: "The hypothesis is X." },
      { type: "EVIDENCE_CHECK", content: "Evidence supports X." },
      { type: "FINAL_CONCLUSION", content: "Conclusion is Y." },
    ];
    const result = validator.validate(validSteps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid: false and errors for an empty array", () => {
    const emptySteps: StructuredThoughtStep[] = [];
    const result = validator.validate(emptySteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Thought steps array cannot be empty.");
  });

  it("should return isValid: false and errors for invalid step types or missing content", () => {
    const invalidSteps: StructuredThoughtStep[] = [
      { type: "INVALID_TYPE", content: "Some content" }, // Invalid type
      { type: "HYPOTHESIS", content: "" }, // Empty content
    ];
    const result = validator.validate(invalidSteps);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Invalid thought step type: INVALID_TYPE");
    expect(result.errors).toContain("Content cannot be empty for type HYPOTHESIS.");
  });
});