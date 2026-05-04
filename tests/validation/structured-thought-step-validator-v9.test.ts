import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV9 } from "../src/validation/structured-thought-step-validator-v9";

describe("StructuredThoughtStepValidatorV9", () => {
  it("should validate a simple sequence of text and tool use blocks", () => {
    const validator = new StructuredThoughtStepValidatorV9();
    const input = [
      { type: "text", text: "User prompt." },
      { type: "tool_use", id: "t1", name: "search", input: { query: "test" } },
      { type: "text", text: "Assistant response." },
    ];
    expect(validator.isValid(input)).toBe(true);
  });

  it("should fail validation if an unknown block type is present", () => {
    const validator = new StructuredThoughtStepValidatorV9();
    const input = [
      { type: "text", text: "Start" },
      { type: "unknown_type", data: "bad" },
      { type: "text", text: "End" },
    ];
    expect(validator.isValid(input)).toBe(false);
  });

  it("should fail validation if tool_use block is missing required fields", () => {
    const validator = new StructuredThoughtStepValidatorV9();
    const input = [
      { type: "text", text: "Start" },
      { type: "tool_use", id: "t1", name: "search" }, // Missing input
      { type: "text", text: "End" },
    ];
    expect(validator.isValid(input)).toBe(false);
  });
});