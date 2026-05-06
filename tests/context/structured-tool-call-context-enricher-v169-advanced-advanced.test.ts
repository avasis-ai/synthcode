import { describe, it, expect } from "vitest";
import { ContextEnricher, ContextSources, ContextEnrichmentOptions } from "../src/context/structured-tool-call-context-enricher-v169-advanced-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("ContextEnricher", () => {
  it("should enrich context with basic history and state when provided", () => {
    const mockHistory: Message[] = [
      new UserMessage("Hello"),
      new AssistantMessage("Hi there!"),
    ];
    const mockHistorySource: HistorySource = {
      getHistory: () => mockHistory,
    };
    const mockStateSource: StateSource = {
      getCurrentState: () => ({ userId: "user123", session: "active" }),
    };
    const mockKnowledgeSource: KnowledgeSource = {
      getKnowledge: () => ({ company: "TechCorp" }),
    };

    const enricher = new ContextEnricher({
      history: mockHistorySource,
      state: mockStateSource,
      knowledge: mockKnowledgeSource,
    });

    const enrichedContext = enricher.enrichContext();

    expect(enrichedContext.history).toEqual(mockHistory);
    expect(enrichedContext.state).toEqual({ userId: "user123", session: "active" });
    expect(enrichedContext.knowledge).toEqual({ company: "TechCorp" });
  });

  it("should handle missing sources gracefully", () => {
    const mockHistorySource: HistorySource = {
      getHistory: () => [],
    };
    const mockStateSource: StateSource = {
      getCurrentState: () => ({}),
    };
    const mockKnowledgeSource: KnowledgeSource = {
      getKnowledge: () => ({}),
    };

    const enricher = new ContextEnricher({
      history: mockHistorySource,
      state: mockStateSource,
      knowledge: mockKnowledgeSource,
    });

    const enrichedContext = enricher.enrichContext();

    expect(enrichedContext.history).toEqual([]);
    expect(enrichedContext.state).toEqual({});
    expect(enrichedContext.knowledge).toEqual({});
  });

  it("should apply merge strategy when merging state and knowledge", () => {
    const mockHistorySource: HistorySource = {
      getHistory: () => [],
    };
    const mockStateSource: StateSource = {
      getCurrentState: () => ({ user: "test", settings: { theme: "dark" } }),
    };
    const mockKnowledgeSource: KnowledgeSource = {
      getKnowledge: () => ({ user: "test", preferences: { theme: "light" } }),
    };

    const enricher = new ContextEnricher({
      history: mockHistorySource,
      state: mockStateSource,
      knowledge: mockKnowledgeSource,
    }, {
      mergeStrategy: "deep",
    });

    const enrichedContext = enricher.enrichContext();

    // Assuming deep merge for 'user' and 'settings'/'preferences'
    expect(enrichedContext.state).toEqual({ user: "test", settings: { theme: "dark" }, preferences: { theme: "light" } });
    expect(enrichedContext.knowledge).toEqual({ user: "test", preferences: { theme: "light" } });
  });
});