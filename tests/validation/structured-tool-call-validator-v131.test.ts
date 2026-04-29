import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV131 } from "../src/validation/structured-tool-call-validator-v131";

describe("StructuredToolCallValidatorV131", () => {
  it("should return valid when tool calls are correctly structured", () => {
    const validator = new StructuredToolCallValidatorV131();
    const context = { /* mock context */ };
    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", toolCalls: [{ id: "call1", function: "get_weather" }] }
    ];
    const result = validator.validate(context, messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if tool calls are missing on assistant message", () => {
    const validator = new StructuredToolCallValidatorV131();
    const context = { /* mock context */ };
    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", content: "The weather is nice." }
    ];
    const result = validator.validate(context, messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Assistant message must contain tool calls.");
  });

  it("should return invalid if tool call IDs are duplicated", () => {
    const validator = new StructuredToolCallValidatorV131();
    const context = { /* mock context */ };
    const messages = [
      { role: "user", content: "Call tool A and tool A again." },
      { role: "assistant", toolCalls: [
        { id: "call1", function: "toolA" },
        { id: "call1", function: "toolB" }
      ]}
    ];
    const result = validator.validate(context, messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Duplicate tool call ID found: call1");
  });
});