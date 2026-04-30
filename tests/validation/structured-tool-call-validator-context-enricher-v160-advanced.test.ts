import { describe, it, expect } from "vitest";
import {
  EnrichedValidationContext,
  createEnrichedValidationContext,
} from "../src/validation/structured-tool-call-validator-context-enricher-v160-advanced";

describe("createEnrichedValidationContext", () => {
  it("should correctly enrich context with basic message history and session ID", async () => {
    const mockMessages: Message[] = [
      { role: "user", content: "Hello", timestamp: Date.now() - 1000 },
      { role: "assistant", content: "Hi there!", timestamp: Date.now() },
    ];
    const mockContext: { messages: Message[]; session_id: string } = {
      messages: mockMessages,
      session_id: "test-session-123",
    };

    const enrichedContext = await createEnrichedValidationContext(
      mockContext,
      {
        last_n_interactions: mockMessages,
        user_preferences: { theme: "dark" },
      },
      {
        related_entities: { "user": ["Alice"], "topic": ["AI"] },
        suggested_tools: ["search", "calculator"],
      }
    );

    expect(enrichedContext.base_context.messages).toEqual(mockMessages);
    expect(enrichedContext.base_context.session_id).toBe("test-session-123");
    expect(enrichedContext.historical_context.user_preferences).toEqual({
      theme: "dark",
    });
    expect(enrichedContext.knowledge_graph_context.related_entities).toEqual({
      user: ["Alice"],
      topic: ["AI"],
    });
    expect(enrichedContext.knowledge_graph_context.suggested_tools).toEqual(
      ["search", "calculator"],
    );
  });

  it("should handle empty or minimal input context gracefully", async () => {
    const mockContext: { messages: Message[]; session_id: string } = {
      messages: [],
      session_id: "empty-session",
    };
    const historicalContext = {
      last_n_interactions: [],
      user_preferences: {},
    };
    const knowledgeGraphContext = {
      related_entities: {},
      suggested_tools: [],
    };

    const enrichedContext = await createEnrichedValidationContext(
      mockContext,
      historicalContext,
      knowledgeGraphContext
    );

    expect(enrichedContext.base_context.messages).toEqual([]);
    expect(enrichedContext.base_context.session_id).toBe("empty-session");
    expect(enrichedContext.historical_context.user_preferences).toEqual({});
    expect(enrichedContext.knowledge_graph_context.related_entities).toEqual({});
    expect(enrichedContext.knowledge_graph_context.suggested_tools).toEqual([]);
  });

  it("should correctly merge and prioritize context data", async () => {
    const mockMessages: Message[] = [
      { role: "user", content: "Test", timestamp: Date.now() },
    ];
    const mockContext: { messages: Message[]; session_id: string } = {
      messages: mockMessages,
      session_id: "merge-test-session",
    };
    const historicalContext = {
      last_n_interactions: mockMessages,
      user_preferences: { theme: "light", timezone: "UTC" },
    };
    const knowledgeGraphContext = {
      related_entities: { "user": ["Bob"] },
      suggested_tools: ["search"],
    };

    const enrichedContext = await createEnrichedValidationContext(
      mockContext,
      historicalContext,
      knowledgeGraphContext
    );

    expect(enrichedContext.base_context.session_id).toBe("merge-test-session");
    expect(enrichedContext.historical_context.user_preferences).toEqual({
      theme: "light",
      timezone: "UTC",
    });
    expect(enrichedContext.knowledge_graph_context.related_entities).toEqual({
      user: ["Bob"],
    });
    expect(enrichedContext.knowledge_graph_context.suggested_tools).toEqual(["search"]);
  });
});