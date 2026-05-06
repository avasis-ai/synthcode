import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface HistorySource {
  getHistory(): Message[];
}

interface StateSource {
  getCurrentState(): Record<string, unknown>;
}

interface KnowledgeSource {
  getKnowledge(): Record<string, any>;
}

type ContextSources = {
  history: HistorySource;
  state: StateSource;
  knowledge: KnowledgeSource;
};

interface ContextEnrichmentOptions {
  mergeStrategy?: (history: Message[], state: Record<string, unknown>, knowledge: Record<string, any>, currentInput: string) => Record<string, any>;
  sourceWeights?: {
    history: number;
    state: number;
    knowledge: number;
  };
}

export class StructuredToolCallContextEnricher {
  private sources: ContextSources;
  private options: ContextEnrichmentOptions;

  constructor(sources: ContextSources, options: ContextEnrichmentOptions = {}) {
    this.sources = sources;
    this.options = {
      mergeStrategy: options.mergeStrategy || this.defaultMergeStrategy,
      sourceWeights: options.sourceWeights || { history: 1.0, state: 1.0, knowledge: 1.0 },
    };
  }

  private defaultMergeStrategy(history: Message[], state: Record<string, unknown>, knowledge: Record<string, any>, currentInput: string): Record<string, any> {
    const context: Record<string, any> = {
      historySummary: history.map(m => m.role === 'user' ? m : m.content).join(" | "),
      currentState: state,
      knowledgeBase: knowledge,
      currentPrompt: currentInput,
    };
    return context;
  }

  public enrichContext(currentInput: string): Record<string, any> {
    const history = this.sources.history.getHistory();
    const state = this.sources.state.getCurrentState();
    const knowledge = this.sources.knowledge.getKnowledge();

    const mergedContext = this.options.mergeStrategy(
      history,
      state,
      knowledge,
      currentInput
    );

    return {
      contextPayload: mergedContext,
      metadata: {
        sourceWeights: this.options.sourceWeights,
        timestamp: Date.now(),
      },
    };
  }
}