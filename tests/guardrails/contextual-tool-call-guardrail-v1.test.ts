import { describe, it, expect } from "vitest";
import { Cont } from "../src/guardrails/contextual-tool-call-guardrail-v1";

describe("ContextualToolCallGuardrailV1", () => {
  it("should return OK when a tool call is appropriate based on context", async () => {
    const guardrail = new Cont();
    const context: AgentContext = {
      history: [
        { role: "user", content: "What is the capital of France?" } as Message,
        { role: "assistant", content: "The capital of France is Paris." } as Message,
      ],
      state: { userLocation: "France" },
    };
    const toolCallRequest: ToolCallRequest = {
      toolName: "get_city_population",
      parameters: { city: "Paris" },
    };
    const result = await guardrail.check(context, toolCallRequest);
    expect(result.isValid).toBe(true);
    expect(result.suggestedAction).toBe("OK");
  });

  it("should return CONTEXTUALLY_INVALID when the tool call is irrelevant to the conversation", async () => {
    const guardrail = new Cont();
    const context: AgentContext = {
      history: [
        { role: "user", content: "Can you explain quantum entanglement?" } as Message,
        { role: "assistant", content: "It's a fascinating topic..." } as Message,
      ],
      state: { topic: "physics" },
    };
    const toolCallRequest: ToolCallRequest = {
      toolName: "get_weather_forecast",
      parameters: { city: "London" },
    };
    const result = await guardrail.check(context, toolCallRequest);
    expect(result.isValid).toBe(false);
    expect(result.suggestedAction).toBe("CONTEXTUALLY_INVALID");
  });

  it("should return REDUNDANT when the information is already available in the context", async () => {
    const guardrail = new Cont();
    const context: AgentContext = {
      history: [
        { role: "user", content: "What is the population of Paris?" } as Message,
        { role: "assistant", content: "The population of Paris is approximately 2.1 million." } as Message,
      ],
      state: { lastKnownPopulation: "2.1 million" },
    };
    const toolCallRequest: ToolCallRequest = {
      toolName: "get_city_population",
      parameters: { city: "Paris" },
    };
    const result = await guardrail.check(context, toolCallRequest);
    expect(result.isValid).toBe(false);
    expect(result.suggestedAction).toBe("REDUNDANT");
  });
});