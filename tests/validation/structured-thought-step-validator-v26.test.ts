import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV26 } from "../src/validation/structured-thought-step-validator-v26";

describe("StructuredThoughtStepValidatorV26", () => {
  it("should validate a simple valid structure", () => {
    const validator = new StructuredThoughtStepValidatorV26();
    const result = validator.validate([
      { role: "user", content: "Hello" },
      { role: "assistant", content: [{ type: "text", content: "Hi there" }] }
    ]);
    expect(result.isValid).toBe(true);
  });

  it("should fail validation if a required field is missing in a message", () => {
    const validator = new StructuredThoughtStepValidatorV26();
    const invalidMessages = [
      { role: "user", content: "Missing role" }, // Missing content
      { role: "assistant", content: null as any } // Invalid content type
    ];
    const result = validator.validate(invalidMessages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("should correctly validate a message containing a tool result", () => {
    const validator = new StructuredThoughtStepValidatorV26();
    const validMessages = [
      { role: "user", content: "What is the weather?" },
      { role: "tool", tool_use_id: "tool_123", content: "Sunny", is_error: false }
    ];
    const result = validator.validate(validMessages);
    expect(result.isValid).toBe(true);
  });
});