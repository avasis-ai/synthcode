import { describe, it, expect } from "vitest";
import { ContextualToolCallHistoryAggregator } from "../src/history/contextual-tool-call-history-aggregator";

describe("ContextualToolCallHistoryAggregator", () => {
  const aggregator = new ContextualToolCallHistoryAggregator();
  const mockContext: { goal: string; currentContext: string } = {
    goal: "Plan a trip to Paris",
    currentContext: "The user is interested in art and history.",
  };

  it("should aggregate a simple conversation history correctly", () => {
    const history: Message[] = [
      {
        role: "user",
        content: "What are the best museums in Paris?",
        type: "user",
      },
      {
        role: "assistant",
        content: "There are many! I recommend the Louvre and the Musée d'Orsay.",
        type: "assistant",
      },
    ];
    const result = aggregator.aggregateHistory(history, mockContext);
    expect(result).toContain("User: What are the best museums in Paris?");
    expect(result).toContain("Assistant: There are many! I recommend the Louvre and the Musée d'Orsay.");
    expect(result).toContain("Goal: Plan a trip to Paris");
  });

  it("should prioritize tool call results when present", () => {
    const history: Message[] = [
      {
        role: "user",
        content: "What is the weather like in Paris tomorrow?",
        type: "user",
      },
      {
        role: "assistant",
        content: "Calling weather tool...",
        type: "assistant",
      },
      {
        role: "tool_result",
        content: "The weather in Paris tomorrow will be sunny with a high of 22C.",
        type: "tool_result",
      },
    ];
    const result = aggregator.aggregateHistory(history, mockContext);
    expect(result).toContain("Tool Result: The weather in Paris tomorrow will be sunny with a high of 22C.");
    expect(result).toContain("Goal: Plan a trip to Paris");
  });

  it("should handle a mix of message types including thinking blocks", () => {
    const history: Message[] = [
      {
        role: "user",
        content: "Can you help me plan a day trip?",
        type: "user",
      },
      {
        role: "assistant",
        content: "Thinking about the best itinerary...",
        type: "assistant",
      },
      {
        role: "thinking",
        content: "Considering art museums and historical sites.",
        type: "thinking",
      },
    ];
    const result = aggregator.aggregateHistory(history, mockContext);
    expect(result).toContain("User: Can you help me plan a day trip?");
    expect(result).toContain("Thinking: Considering art museums and historical sites.");
    expect(result).toContain("Goal: Plan a trip to Paris");
  });
});