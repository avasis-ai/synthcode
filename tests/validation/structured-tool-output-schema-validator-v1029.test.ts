import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1029 } from "../src/validation/structured-tool-output-schema-validator-v1029";
import { Message } from "../src/validation/types";

describe("StructuredToolOutputSchemaValidatorV1029", () => {
  it("should validate correctly when all tool outputs match the expected schema", () => {
    const mockToolContexts = [
      {
        toolName: "getWeather",
        expectedInputSchema: { location: "string", unit: "string" },
      },
    ];
    const validator = new StructuredToolOutputSchemaValidatorV1029(mockToolContexts);

    const messages: Message[] = [
      {
        role: "user",
        content: [{ type: "text", text: "What's the weather in London?" }],
      },
      {
        role: "tool",
        content: [{ type: "tool_result", toolName: "getWeather", content: { location: "London", unit: "Celsius" } }],
      },
    ];

    const result = validator.validate(messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when a tool output is missing required fields", () => {
    const mockToolContexts = [
      {
        toolName: "getWeather",
        expectedInputSchema: { location: "string", unit: "string" },
      },
    ];
    const validator = new StructuredToolOutputSchemaValidatorV1029(mockToolContexts);

    const messages: Message[] = [
      {
        role: "user",
        content: [{ type: "text", text: "What's the weather in Paris?" }],
      },
      {
        role: "tool",
        content: [{ type: "tool_result", toolName: "getWeather", content: { location: "Paris" } }], // Missing 'unit'
      },
    ];

    const result = validator.validate(messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool 'getWeather' output is missing required field: unit");
  });

  it("should report errors when an unknown tool is used", () => {
    const mockToolContexts = [
      {
        toolName: "getWeather",
        expectedInputSchema: { location: "string", unit: "string" },
      },
    ];
    const validator = new StructuredToolOutputSchemaValidatorV1029(mockToolContexts);

    const messages: Message[] = [
      {
        role: "user",
        content: [{ type: "text", text: "What's the weather in Tokyo?" }],
      },
      {
        role: "tool",
        content: [{ type: "tool_result", toolName: "getWeatherUnknown", content: { location: "Tokyo", unit: "Celsius" } }], // Unknown tool
      },
    ];

    const result = validator.validate(messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Unknown tool used: getWeatherUnknown");
  });
});