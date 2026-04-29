import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV132 } from "../src/validation/structured-tool-call-validator-v132";
import { Message, ToolUseBlock, ToolResultMessage } from "../src/validation/types";

describe("StructuredToolCallValidatorV132", () => {
  it("should return invalid if any tool call is missing an ID", () => {
    const validator = new StructuredToolCallValidatorV132();
    const context: ValidationContext = { history: [] };
    const toolCalls: ToolUseBlock[] = [
      { id: "call1", name: "toolA", tool_call_id: "call1" },
      { id: "", name: "toolB", tool_call_id: "call2" },
    ];
    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("All tool calls must have a non-empty ID.");
  });

  it("should return valid for a set of correctly structured tool calls", () => {
    const validator = new StructuredToolCallValidatorV132();
    const context: ValidationContext = { history: [] };
    const toolCalls: ToolUseBlock[] = [
      { id: "call1", name: "toolA", tool_call_id: "call1" },
      { id: "call2", name: "toolB", tool_call_id: "call2" },
    ];
    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should handle an empty array of tool calls gracefully", () => {
    const validator = new StructuredToolCallValidatorV132();
    const context: ValidationContext = { history: [] };
    const toolCalls: ToolUseBlock[] = [];
    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});