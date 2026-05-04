import { describe, it, expect } from "vitest";
import { EnrichedToolCallContext } from "../src/validation/structured-tool-call-context-enricher-v161-advanced-advanced";

describe("EnrichedToolCallContext", () => {
  it("should correctly enrich context with basic data", () => {
    const mockContext: AgentContext = {
      sessionId: "test-session-123",
      userMessage: "What is the weather like?",
      history: [],
    };
    const mockHistory: ToolUsageHistory = [];
    const mockCapabilities: CapabilityRegistry = {
      weatherService: "WeatherService",
    };

    const enrichedContext: EnrichedToolCallContext = {
      currentContext: mockContext,
      history: mockHistory,
      capabilities: mockCapabilities,
      enrichedPayload: {
        reasoning: "The user asked about the weather.",
        requiredCapabilities: ["weatherService"],
        suggestedToolCalls: [
          {
            toolName: "getWeather",
            input: { location: "New York" },
            confidenceScore: 0.9,
          },
        ],
        contex: "context_data",
      },
    };

    expect(enrichedContext.currentContext).toBe(mockContext);
    expect(enrichedContext.history).toBe(mockHistory);
    expect(enrichedContext.capabilities).toBe(mockCapabilities);
    expect(enrichedContext.enrichedPayload.reasoning).toBe("The user asked about the weather.");
    expect(enrichedContext.enrichedPayload.suggestedToolCalls).toHaveLength(1);
  });

  it("should handle empty history and no suggested tool calls", () => {
    const mockContext: AgentContext = {
      sessionId: "test-session-456",
      userMessage: "Just chatting.",
      history: [],
    };
    const mockHistory: ToolUsageHistory = [];
    const mockCapabilities: CapabilityRegistry = {};

    const enrichedContext: EnrichedToolCallContext = {
      currentContext: mockContext,
      history: mockHistory,
      capabilities: mockCapabilities,
      enrichedPayload: {
        reasoning: "No specific action required.",
        requiredCapabilities: [],
        suggestedToolCalls: [],
        contex: "empty_context",
      },
    };

    expect(enrichedContext.enrichedPayload.requiredCapabilities).toEqual([]);
    expect(enrichedContext.enrichedPayload.suggestedToolCalls).toEqual([]);
  });

  it("should correctly populate tool calls with multiple suggestions", () => {
    const mockContext: AgentContext = {
      sessionId: "test-session-789",
      userMessage: "Book a flight and check the stock price.",
      history: [],
    };
    const mockHistory: ToolUsageHistory = [];
    const mockCapabilities: CapabilityRegistry = {
      flightBooking: "FlightBooking",
      stockChecker: "StockChecker",
    };

    const enrichedContext: EnrichedToolCallContext = {
      currentContext: mockContext,
      history: mockHistory,
      capabilities: mockCapabilities,
      enrichedPayload: {
        reasoning: "User needs travel and financial info.",
        requiredCapabilities: ["flightBooking", "stockChecker"],
        suggestedToolCalls: [
          {
            toolName: "bookFlight",
            input: { origin: "LAX", destination: "JFK" },
            confidenceScore: 0.95,
          },
          {
            toolName: "checkStock",
            input: { ticker: "GOOGL" },
            confidenceScore: 0.88,
          },
        ],
        contex: "multi_tool_context",
      },
    };

    expect(enrichedContext.enrichedPayload.suggestedToolCalls).toHaveLength(2);
    expect(enrichedContext.enrichedPayload.suggestedToolCalls[0].toolName).toBe("bookFlight");
    expect(enrichedContext.enrichedPayload.suggestedToolCalls[1].toolName).toBe("checkStock");
  });
});