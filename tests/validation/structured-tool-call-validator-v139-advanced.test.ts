import { describe, it, expect } from "vitest";
import { ToolCallSequenceValidator } from "../src/validation/structured-tool-call-validator-v139-advanced";

describe("ToolCallSequenceValidator", () => {
  it("should validate a simple, valid sequence of tool calls", () => {
    const validator = new ToolCallSequenceValidator();
    const toolCalls = [
      { toolName: "getWeather", input: { location: "Tokyo" } },
    ];
    const context = {
      toolSchemas: {
        getWeather: {
          input: { location: { type: "string" } },
          output: { temperature: { type: "number" } },
        },
      },
    };
    const result = validator.validateSequence(toolCalls, context);
    expect(result).toBe(true);
  });

  it("should return false if a tool call uses an unknown tool name", () => {
    const validator = new ToolCallSequenceValidator();
    const toolCalls = [
      { toolName: "unknownTool", input: {} },
    ];
    const context = {
      toolSchemas: {
        getWeather: {
          input: { location: { type: "string" } },
          output: { temperature: { type: "number" } },
        },
      },
    };
    const result = validator.validateSequence(toolCalls, context);
    expect(result).toBe(false);
  });

  it("should handle validation failure when input schema is violated", () => {
    const validator = new ToolCallSequenceValidator();
    const toolCalls = [
      { toolName: "getWeather", input: { location: 123 } }, // Should be string
    ];
    const context = {
      toolSchemas: {
        getWeather: {
          input: { location: { type: "string" } },
          output: { temperature: { type: "number" } },
        },
      },
    };
    const result = validator.validateSequence(toolCalls, context);
    expect(result).toBe(false);
  });
});