import { describe, it, expect } from "vitest";
import {
  ContextualToolCallGuardrailChain,
  AgentContext,
  ToolCallHistory,
  ToolCallRequest,
  ValidationResult,
} from "../src/guardrails/contextual-tool-call-guardrail-chain";

describe("ContextualToolCallGuardrailChain", () => {
  it("should validate a simple, valid tool call request", async () => {
    const context: AgentContext = {};
    const history: ToolCallHistory = {};
    const request: ToolCallRequest = {
      tool_name: "get_weather",
      input: { location: "New York" },
    };

    const result = await ContextualToolCallGuardrailChain.validate(
      context,
      history,
      request
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation if the tool name is missing", async () => {
    const context: AgentContext = {};
    const history: ToolCallHistory = {};
    const request: ToolCallRequest = {
      tool_name: "",
      input: { location: "Someplace" },
    };

    const result = await ContextualToolCallGuardrailChain.validate(
      context,
      history,
      request
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool name cannot be empty.");
  });

  it("should fail validation if the input is missing required parameters based on context (mocked)", async () => {
    const context: AgentContext = {
      required_tools: ["get_weather"],
    };
    const history: ToolCallHistory = {};
    const request: ToolCallRequest = {
      tool_name: "get_weather",
      input: { location: null }, // Simulate missing required input
    };

    const result = await ContextualToolCallGuardrailChain.validate(
      context,
      history,
      request
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input for 'get_weather' is missing required parameter: location");
  });
});