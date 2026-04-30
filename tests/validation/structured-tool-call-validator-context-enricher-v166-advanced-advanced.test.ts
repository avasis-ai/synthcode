import { describe, it, expect, vi } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV166AdvancedAdvanced,
} from "../src/validation/structured-tool-call-validator-context-enricher-v166-advanced-advanced";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricherV166AdvancedAdvanced", () => {
  it("should enrich context when only user messages are present", async () => {
    const mockContextualKnowledgeRetriever = {
      retrieveIntent: vi.fn().mockResolvedValue({ intent: "user_query" }),
    };
    const mockStatefulHistoryStore = {
      getHistorySummary: vi.fn().mockResolvedValue({ historySummary: "Recent user activity." }),
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV166AdvancedAdvanced(
      {
        contextualKnowledgeRetriever: mockContextualKnowledgeRetriever,
        statefulHistoryStore: mockStatefulHistoryStore,
      },
    );

    const messages: Message[] = [
      UserMessage.from({ content: "What is the capital of France?" }),
    ];

    const enrichedContext = await enricher.enrichContext(messages);

    expect(mockContextualKnowledgeRetriever.retrieveIntent).toHaveBeenCalledWith(
      messages,
    );
    expect(mockStatefulHistoryStore.getHistorySummary).toHaveBeenCalledWith(
      messages,
    );
    expect(enrichedContext).toBeDefined();
  });

  it("should handle mixed message types correctly", async () => {
    const mockContextualKnowledgeRetriever = {
      retrieveIntent: vi.fn().mockResolvedValue({ intent: "mixed_query" }),
    };
    const mockStatefulHistoryStore = {
      getHistorySummary: vi.fn().mockResolvedValue({ historySummary: "Mixed interaction." }),
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV166AdvancedAdvanced(
      {
        contextualKnowledgeRetriever: mockContextualKnowledgeRetriever,
        statefulHistoryStore: mockStatefulHistoryStore,
      },
    );

    const messages: Message[] = [
      UserMessage.from({ content: "Hello" }),
      AssistantMessage.from({ content: "Hi there!" }),
      ToolResultMessage.from({ content: "Tool executed successfully." }),
    ];

    const enrichedContext = await enricher.enrichContext(messages);

    expect(mockContextualKnowledgeRetriever.retrieveIntent).toHaveBeenCalledWith(
      messages,
    );
    expect(mockStatefulHistoryStore.getHistorySummary).toHaveBeenCalledWith(
      messages,
    );
    expect(enrichedContext).toBeDefined();
  });

  it("should return a default structure if dependencies fail", async () => {
    const mockContextualKnowledgeRetriever = {
      retrieveIntent: vi.fn().mockRejectedValue(new Error("Knowledge retrieval failed")),
    };
    const mockStatefulHistoryStore = {
      getHistorySummary: vi.fn().mockRejectedValue(new Error("History store failed")),
    };

    const enricher = new StructuredToolCallValidatorContextEnricherV166AdvancedAdvanced(
      {
        contextualKnowledgeRetriever: mockContextualKnowledgeRetriever,
        statefulHistoryStore: mockStatefulHistoryStore,
      },
    );

    const messages: Message[] = [UserMessage.from({ content: "Test" })];

    // We expect it to handle the errors gracefully and still return a structure
    const enrichedContext = await enricher.enrichContext(messages);

    expect(mockContextualKnowledgeRetriever.retrieveIntent).toHaveBeenCalledTimes(1);
    expect(mockStatefulHistoryStore.getHistorySummary).toHaveBeenCalledTimes(1);
    expect(enrichedContext).toBeDefined();
  });
});