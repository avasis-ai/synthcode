import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV20AdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v20-advanced-advanced";

describe("StructuredThoughtStepValidatorV20AdvancedAdvanced", () => {
  it("should validate a simple, valid sequence of messages", async () => {
    const validator = new StructuredThoughtStepValidatorV20AdvancedAdvanced();
    const messages = [
      { role: "user", content: "Hello world" },
      { role: "assistant", content: [] }, // Assuming empty content is valid for simplicity in this test context
    ];
    const result = await validator.validate(messages);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid if a required field is missing in a user message", async () => {
    const validator = new StructuredThoughtStepValidatorV20AdvancedAdvanced();
    const messages = [
      { role: "user", content: "" }, // Missing content might trigger validation failure depending on implementation
    ];
    // Adjusting expectation based on typical validation failure for empty content
    const result = await validator.validate(messages);
    expect(result.isValid).toBe(false);
  });

  it("should handle a mix of message types correctly", async () => {
    const validator = new StructuredThoughtStepValidatorV20AdvancedAdvanced();
    const messages = [
      { role: "user", content: "Initial prompt" },
      { role: "assistant", content: [] },
      { role: "tool", tool_use_id: "tool1", content: "Tool output" },
    ];
    const result = await validator.validate(messages);
    expect(result.isValid).toBe(true);
  });
});