import { describe, it, expect } from "vitest";
import {
  validateStructuredToolCall,
  AdvancedCallContext,
  ToolCallSequence,
} from "../src/validation/structured-tool-call-validator-v169-advanced-advanced";

describe("validateStructuredToolCall", () => {
  it("should return true for a valid basic tool call sequence", () => {
    const context: AdvancedCallContext = {
      previousToolOutput: null,
      causalityLinks: [],
      intentMarkers: {},
    };
    const sequence: ToolCallSequence = {
      calls: [
        { toolName: "getWeather", input: { location: "New York" } },
        { toolName: "searchWeb", input: { query: "weather in New York" } },
      ],
    };
    expect(validateStructuredToolCall(sequence, context)).toBe(true);
  });

  it("should return false if toolName is missing in a call", () => {
    const context: AdvancedCallContext = {
      previousToolOutput: null,
      causalityLinks: [],
      intentMarkers: {},
    };
    const sequence: ToolCallSequence = {
      calls: [
        { toolName: "getWeather", input: { location: "New York" } },
        { input: { query: "weather" } }, // Missing toolName
      ],
    };
    expect(validateStructuredToolCall(sequence, context)).toBe(false);
  });

  it("should return false if input is not an object for a call", () => {
    const context: AdvancedCallContext = {
      previousToolOutput: null,
      causalityLinks: [],
      intentMarkers: {},
    };
    const sequence: ToolCallSequence = {
      calls: [
        { toolName: "getWeather", input: "not an object" }, // Invalid input type
      ],
    };
    expect(validateStructuredToolCall(sequence, context)).toBe(false);
  });
});