import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV11 } from "../src/validation/structured-thought-step-validator-v11";

describe("StructuredThoughtStepValidatorV11", () => {
  it("should validate a simple valid message structure", () => {
    const validator = new StructuredThoughtStepValidatorV11();
    const validMessage = {
      role: "user",
      content: "Hello world",
    };
    const result = validator.validate(validMessage);
    expect(result.isValid).toBe(true);
  });

  it("should validate a message with assistant content blocks", () => {
    const validator = new StructuredThoughtStepValidatorV11();
    const validMessage = {
      role: "assistant",
      content: [{ type: "text", text: "Some assistant response" }],
    };
    const result = validator.validate(validMessage);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid for a message missing the 'role' field", () => {
    const validator = new StructuredThoughtStepValidatorV11();
    const invalidMessage = {
      content: "This message is missing role",
    };
    const result = validator.validate(invalidMessage);
    expect(result.isValid).toBe(false);
  });
});