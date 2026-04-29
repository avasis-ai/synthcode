import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorAdvanced } from "../src/validation/structured-tool-call-validator-advanced";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("StructuredToolCallValidatorAdvanced", () => {
  it("should return isValid true for a valid sequence of tool calls", () => {
    const validator = new StructuredToolCallValidatorAdvanced();
    const toolCalls: ToolUseBlock[] = [
      { id: "call1", toolName: "getWeather", toolCallId: "call1" },
      { id: "call2", toolName: "getWeather", toolCallId: "call2" },
    ];
    const history: Message[] = [
      { role: "user", content: "What is the weather?" },
      { role: "model", content: "Calling tool: getWeather(location='London')" },
    ];
    const result = validator.validate(toolCalls, history);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect duplicate tool call IDs", () => {
    const validator = new StructuredToolCallValidatorAdvanced();
    const toolCalls: ToolUseBlock[] = [
      { id: "call1", toolName: "getWeather", toolCallId: "call1" },
      { id: "call1", toolName: "getWeather", toolCallId: "call1" },
    ];
    const history: Message[] = [{ role: "user", content: "Test" }];
    const result = validator.validate(toolCalls, history);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Duplicate tool call ID found: call1");
  });

  it("should detect an invalid tool call structure if toolName is missing", () => {
    const validator = new StructuredToolCallValidatorAdvanced();
    const toolCalls: ToolUseBlock[] = [
      { id: "call1", toolName: "", toolCallId: "call1" },
    ];
    const history: Message[] = [{ role: "user", content: "Test" }];
    const result = validator.validate(toolCalls, history);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call name cannot be empty.");
  });
});