import { describe, it, expect } from "vitest";
import {
  ContextualToolCallValidatorContextEnricherV163AdvancedAdvanced,
  EnrichedContext,
} from "../src/validation/contextual-tool-call-validator-context-enricher-v163-advanced-advanced";

describe("ContextualToolCallValidatorContextEnricherV163AdvancedAdvanced", () => {
  it("should enrich context with basic agent state and tool history", () => {
    const mockContext: EnrichedContext = {
      agentState: {
        currentState: {
          userQuery: "What is the weather like?",
        },
        lastToolCallId: "tool_call_123",
      },
      toolCallHistory: {
        getWeather: {
          toolName: "getWeather",
          lastUsed: Date.now() - 10000,
          callCount: 5,
        },
        getStocks: {
          toolName: "getStocks",
          lastUsed: Date.now() - 5000,
          callCount: 2,
        },
      },
    };
    const enricher = new ContextualToolCallValidatorContextEnricherV163AdvancedAdvanced();
    const result = enricher.enrich(mockContext);

    expect(result.agentState).toEqual(mockContext.agentState);
    expect(result.toolCallHistory).toEqual(mockContext.toolCallHistory);
  });

  it("should handle empty or minimal context gracefully", () => {
    const mockContext: EnrichedContext = {
      agentState: {
        currentState: {},
        lastToolCallId: null,
      },
      toolCallHistory: {},
    };
    const enricher = new ContextualToolCallValidatorContextEnricherV163AdvancedAdvanced();
    const result = enricher.enrich(mockContext);

    expect(result.agentState).toEqual(mockContext.agentState);
    expect(result.toolCallHistory).toEqual(mockContext.toolCallHistory);
  });

  it("should correctly process context when only some history is present", () => {
    const mockContext: EnrichedContext = {
      agentState: {
        currentState: {
          userQuery: "Check my bank balance.",
        },
        lastToolCallId: null,
      },
      toolCallHistory: {
        getBankBalance: {
          toolName: "getBankBalance",
          lastUsed: Date.now(),
          callCount: 1,
        },
      },
    };
    const enricher = new ContextualToolCallValidatorContextEnricherV163AdvancedAdvanced();
    const result = enricher.enrich(mockContext);

    expect(result.agentState).toEqual(mockContext.agentState);
    expect(result.toolCallHistory).toEqual(mockContext.toolCallHistory);
  });
});