import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV137 } from "../src/validation/structured-tool-call-validator-v137";

describe("StructuredToolCallValidatorV137", () => {
  it("should return valid result for a simple conversation with no tool calls", () => {
    const validator = new StructuredToolCallValidatorV137();
    const messages = [
      { role: "user", content: [{ type: "text", text: "Hello world" }] },
      { role: "assistant", content: [{ type: "text", text: "Hi there!" }] },
    ];
    const result = validator.validate(messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect an invalid sequence when a tool use is followed by a user message", () => {
    const validator = new StructuredToolCallValidatorV137();
    const messages = [
      { role: "user", content: [{ type: "text", text: "What is the weather?" }] },
      { role: "assistant", content: [{ type: "tool_use", toolCall: { id: "call1", name: "get_weather", input: {} } }] },
      { role: "user", content: [{ type: "text", text: "Thanks" }] }, // Invalid sequence
    ];
    const result = validator.validate(messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool use must be followed by a tool response or end of conversation.");
  });

  it("should return valid result for a complete tool call sequence (user -> tool_use -> tool_response)", () => {
    const validator = new StructuredToolCallValidatorV137();
    const messages = [
      { role: "user", content: [{ type: "text", text: "Get the weather for London" }] },
      { role: "assistant", content: [{ type: "tool_use", toolCall: { id: "call1", name: "get_weather", input: { location: "London" } } }] },
      { role: "tool", content: [{ type: "tool_response", toolCallId: "call1", response: { temperature: "15C", condition: "Cloudy" } }] },
    ];
    const result = validator.validate(messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});