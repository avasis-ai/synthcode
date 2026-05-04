import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV19 } from "../src/validation/structured-thought-step-validator-v19";

describe("StructuredThoughtStepValidatorV19", () => {
  it("should validate a simple valid structure", () => {
    const validator = new StructuredThoughtStepValidatorV19();
    const result = validator.validate({
      role: "user",
      content: "Hello world",
    });
    expect(result.isValid).toBe(true);
  });

  it("should fail validation for missing role", () => {
    const validator = new StructuredThoughtStepValidatorV19();
    const result = validator.validate({
      content: "Some content",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing 'role' field.");
  });

  it("should fail validation for invalid content type on assistant message", () => {
    const validator = new StructuredThoughtStepValidatorV19();
    const invalidMessage = {
      role: "assistant",
      content: "This is not an array",
    };
    const result = validator.validate(invalidMessage);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Content must be an array of ContentBlock.");
  });
});