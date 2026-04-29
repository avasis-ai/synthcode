import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV134 } from "../src/validation/structured-tool-call-validator-v134";
import { ToolCallSchema } from "../src/validation/types";

describe("StructuredToolCallValidatorV134", () => {
  it("should validate a correctly structured tool call", () => {
    const schemas: ToolCallSchema[] = [
      {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          location: { type: "string" },
          unit: { type: "string" },
        },
      },
    ];
    const validator = new StructuredToolCallValidatorV134(schemas);
    const toolUse = {
      toolName: "get_current_weather",
      toolCallId: "call_abc123",
      args: {
        location: "San Francisco",
        unit: "celsius",
      },
    };

    const result = validator.validateToolCall(toolUse);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid for a tool call with missing required arguments", () => {
    const schemas: ToolCallSchema[] = [
      {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          location: { type: "string" },
          unit: { type: "string" },
        },
      },
    ];
    const validator = new StructuredToolCallValidatorV134(schemas);
    const toolUse = {
      toolName: "get_current_weather",
      toolCallId: "call_def456",
      args: {
        location: "New York",
        // unit is missing
      },
    };

    const result = validator.validateToolCall(toolUse);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required argument: unit");
  });

  it("should return invalid for an unknown tool name", () => {
    const schemas: ToolCallSchema[] = [
      {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          location: { type: "string" },
          unit: { type: "string" },
        },
      },
    ];
    const validator = new StructuredToolCallValidatorV134(schemas);
    const toolUse = {
      toolName: "non_existent_tool",
      toolCallId: "call_ghi789",
      args: {
        location: "London",
        unit: "fahrenheit",
      },
    };

    const result = validator.validateToolCall(toolUse);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Unknown tool name: non_existent_tool");
  });
});