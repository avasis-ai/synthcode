import { describe, it, expect } from "vitest";
import { StructuredToolCallValidator } from "../src/validation/structured-tool-call-validation-chain";
import { ToolUseBlock } from "../src/validation/types";

describe("StructuredToolCallValidator", () => {
  it("should return valid result for empty tool calls", () => {
    const validator = new StructuredToolCallValidator();
    const result = validator.validate([]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for malformed tool calls", () => {
    const validator = new StructuredToolCallValidator();
    const invalidCalls: ToolUseBlock[] = [
      {
        tool_call_id: "id1",
        name: "non-existent-tool",
        args: {
          invalid_key: "value",
        },
      },
    ];
    const result = validator.validate(invalidCalls);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Tool 'non-existent-tool' not found");
  });

  it("should return valid result for correctly structured tool calls", () => {
    const validator = new StructuredToolCallValidator();
    const validCalls: ToolUseBlock[] = [
      {
        tool_call_id: "id1",
        name: "get_current_weather",
        args: {
          location: "San Francisco",
          unit: "celsius",
        },
      },
    ];
    const result = validator.validate(validCalls);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});