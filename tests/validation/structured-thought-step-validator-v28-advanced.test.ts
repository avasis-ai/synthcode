import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidator } from "../src/validation/structured-thought-step-validator-v28-advanced";

describe("StructuredThoughtStepValidator", () => {
  it("should validate a single valid step", () => {
    const validator = new StructuredThoughtStepValidator();
    const validSteps: any[] = [
      { role: "user", content: { type: "text", text: "Hello" } },
      { role: "assistant", content: { type: "thinking", thinking: { text: "Thinking process..." } } },
    ];
    const result = validator.validate(validSteps, 1, validSteps[1], validSteps.slice(0, 1));
    expect(result.isValid).toBe(true);
  });

  it("should fail validation if the current step is not an assistant thinking step", () => {
    const validator = new StructuredThoughtStepValidator();
    const invalidSteps: any[] = [
      { role: "user", content: { type: "text", text: "Initial message" } },
      { role: "user", content: { type: "text", text: "Another user message" } },
    ];
    const result = validator.validate(invalidSteps, 1, invalidSteps[1], invalidSteps.slice(0, 1));
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("must be an assistant thinking step");
  });

  it("should pass validation for a sequence of valid steps", () => {
    const validator = new StructuredThoughtStepValidator();
    const validSteps: any[] = [
      { role: "user", content: { type: "text", text: "Start" } },
      { role: "assistant", content: { type: "thinking", thinking: { text: "Step 1" } } },
      { role: "assistant", content: { type: "thinking", thinking: { text: "Step 2" } } },
    ];
    const result = validator.validate(validSteps, 2, validSteps[2], validSteps.slice(0, 2));
    expect(result.isValid).toBe(true);
  });
});