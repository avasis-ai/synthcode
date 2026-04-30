import { describe, it, expect } from "vitest";
import { EnrichedContext } from "../src/validation/structured-tool-call-validator-context-enricher-v161-advanced-advanced";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should correctly enrich context with basic message and intent", () => {
    const baseMessage: Message = { role: "user", content: [{ type: "text", text: "What is the capital of France?" }] };
    const intent: IntentContext = { primaryIntent: "query_location", keywords: ["capital", "france"] };
    const history: HistoryContext = { recentInteractions: [], summary: "Initial query." };

    const enrichedContext: EnrichedContext = {
      baseMessage: baseMessage,
      intent: intent,
      history: history,
    };

    expect(enrichedContext.baseMessage).toEqual(baseMessage);
    expect(enrichedContext.intent).toEqual(intent);
    expect(enrichedContext.history).toEqual(history);
  });

  it("should handle a populated history context", () => {
    const baseMessage: Message = { role: "user", content: [{ type: "text", text: "Tell me about AI." }] };
    const intent: IntentContext = { primaryIntent: "query_topic", keywords: ["AI"] };
    const history: HistoryContext = {
      recentInteractions: [
        { role: "user", content: [{ type: "text", text: "What is AI?" }] },
        { role: "assistant", content: [{ type: "text", text: "AI is fascinating." }] },
      ],
      summary: "Previous conversation about AI basics.",
    };

    const enrichedContext: EnrichedContext = {
      baseMessage: baseMessage,
      intent: intent,
      history: history,
    };

    expect(enrichedContext.history.recentInteractions.length).toBe(2);
    expect(enrichedContext.history.summary).toBe("Previous conversation about AI basics.");
  });

  it("should correctly structure the enriched context when all parts are provided", () => {
    const baseMessage: Message = { role: "user", content: [{ type: "text", text: "Book me a flight to Tokyo." }] };
    const intent: IntentContext = { primaryIntent: "book_travel", keywords: ["flight", "Tokyo"] };
    const history: HistoryContext = {
      recentInteractions: [{ role: "user", content: [{ type: "text", text: "Need travel plans." }] }],
      summary: "User needs travel assistance.",
    };

    const enrichedContext: EnrichedContext = {
      baseMessage: baseMessage,
      intent: intent,
      history: history,
    };

    expect(enrichedContext.baseMessage.role).toBe("user");
    expect(enrichedContext.intent.primaryIntent).toBe("book_travel");
    expect(enrichedContext.history.summary).toContain("travel assistance");
  });
});