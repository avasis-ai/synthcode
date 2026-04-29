import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV130 } from "../src/validation/structured-tool-call-validator-v130";
import { Message, ToolUseBlock } from "../src/types";

describe("StructuredToolCallValidatorV130", () => {
  it("should validate a correctly structured tool call message", () => {
    const mockToolDefinitions = new Map<string, any>();
    mockToolDefinitions.set("getWeather", {
      name: "getWeather",
      description: "Get the current weather",
      parameters: {
        location: { type: "string" },
        unit: { type: "string" },
      },
    });
    const validator = new StructuredToolCallValidatorV130(mockToolDefinitions);

    const validMessage: Message = {
      role: "tool",
      content: [{
        type: "tool_use",
        tool_use: {
          tool_use_id: "call_123",
          tool_name: "getWeather",
          input: { location: "London", unit: "celsius" },
        },
      }],
    };

    const result = validator.validate(validMessage);
    expect(result).toBe(true);
  });

  it("should return false for a message missing the tool_use block", () => {
    const mockToolDefinitions = new Map<string, any>();
    mockToolDefinitions.set("getWeather", {
      name: "getWeather",
      description: "Get the current weather",
      parameters: {
        location: { type: "string" },
        unit: { type: "string" },
      },
    });
    const validator = new StructuredToolCallValidatorV130(mockToolDefinitions);

    const invalidMessage: Message = {
      role: "tool",
      content: [{
        type: "text",
        text: "This is just text.",
      }],
    };

    const result = validator.validate(invalidMessage);
    expect(result).toBe(false);
  });

  it("should return false if the tool_name does not match any defined tool", () => {
    const mockToolDefinitions = new Map<string, any>();
    mockToolDefinitions.set("getWeather", {
      name: "getWeather",
      description: "Get the current weather",
      parameters: {
        location: { type: "string" },
        unit: { type: "string" },
      },
    });
    const validator = new StructuredToolCallValidatorV130(mockToolDefinitions);

    const invalidMessage: Message = {
      role: "tool",
      content: [{
        type: "tool_use",
        tool_use: {
          tool_use_id: "call_123",
          tool_name: "nonExistentTool",
          input: { location: "Paris" },
        },
      }],
    };

    const result = validator.validate(invalidMessage);
    expect(result).toBe(false);
  });
});