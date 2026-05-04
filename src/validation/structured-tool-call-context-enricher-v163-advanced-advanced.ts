import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface HistoryStore {
  getSummary(history: Message[]): string;
}

interface ConstraintResolver {
  getActiveConstraints(): Record<string, string>;
}

interface KnowledgeRetriever {
  retrieveSnippets(query: string): string[];
}

export interface EnrichedToolCallContext {
  historySummary: string;
  activeConstraints: Record<string, string>;
  knowledgeSnippets: string[];
  baseContext: {
    messages: Message[];
    toolCallId: string;
  };
}

export class StructuredToolCallContextEnricher {
  private historyStore: HistoryStore;
  private constraintResolver: ConstraintResolver;
  private knowledgeRetriever: KnowledgeRetriever;

  constructor(
    historyStore: HistoryStore,
    constraintResolver: ConstraintResolver,
    knowledgeRetriever: KnowledgeRetriever
  ) {
    this.historyStore = historyStore;
    this.constraintResolver = constraintResolver;
    this.knowledgeRetriever = knowledgeRetriever;
  }

  enrich(
    baseContext: {
      messages: Message[];
      toolCallId: string;
    }
  ): EnrichedToolCallContext {
    const historySummary = this.historyStore.getSummary(baseContext.messages);
    const activeConstraints = this.constraintResolver.getActiveConstraints();
    const knowledgeSnippets = this.knowledgeRetriever.retrieveSnippets(
      baseContext.messages.length > 0 ? baseContext.messages[baseContext.messages.length - 1].content : ""
    );

    return {
      historySummary,
      activeConstraints,
      knowledgeSnippets,
      baseContext: {
        messages: baseContext.messages,
        toolCallId: baseContext.toolCallId,
      },
    };
  }
}