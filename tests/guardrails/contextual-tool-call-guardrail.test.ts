import { describe, it, expect } from "vitest";
import { ContextualToolCallGuardrail } from "../src/guardrails/contextual-tool-call-guardrail";

describe("ContextualToolCallGuardrail", () => {
  const mockToolDefinitions = {
    getWeather: {
      description: "Get the current weather in a given location.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "The city and state, e.g., San Francisco, CA" },
        },
        required: ["location"],
      },
    },
    searchWeb: {
      description: "Search the web for general information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  };

  it("should return isValid true when the tool call matches the context and definitions", () => {
    const guardrail = new ContextualToolCallGuardrail(mockToolDefinitions);
    const context: any = {
      history: [
        { role: "user", content: "What's the weather like in San Francisco, CA?" }
      ],
      state: {
        user_id: "user123"
      }
    };
    const toolCall = {
      name: "getWeather",
      input: {
        location: "San Francisco, CA"
      }
    };
    const result = guardrail.validate(context, toolCall);
    expect(result.isValid).toBe(true);
    expect(result.reason).toBe("");
  });

  it("should return isValid false when the tool call name is unknown", () => {
    const guardrail = new ContextualToolCallGuardrail(mockToolDefinitions);
    const context: any = {
      history: [{ role: "user", content: "Hello" }],
      state: {}
    };
    const toolCall = {
      name: "unknownTool",
      input: {
        query: "test"
      }
    };
    const result = guardrail.validate(context, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Unknown tool name");
  });

  it("should return isValid false when the tool call input is missing required parameters", () => {
    const guardrail = new ContextualToolCallGuardrail(mockToolDefinitions);
    const context: any = {
      history: [{ role: "user", content: "Search for dogs" }],
      state: {}
    };
    const toolCall = {
      name: "searchWeb",
      input: {}
    };
    const result = guardrail.validate(context, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Missing required parameters");
  });
});