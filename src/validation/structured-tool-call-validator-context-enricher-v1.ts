import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextSource {
  getHistory(): Message[];
  getState(): Record<string, unknown>;
  getExternalContext(): Record<string, unknown>;
}

export interface EnrichedContext {
  history: Message[];
  state: Record<string, unknown>;
  external: Record<string, unknown>;
  combined: Record<string, unknown>;
}

export class StructuredToolCallValidatorContextEnricher {
  private sources: ContextSource;

  constructor(sources: ContextSource) {
    this.sources = sources;
  }

  enrichContext(): EnrichedContext {
    const history = this.sources.getHistory();
    const state = this.sources.getState();
    const external = this.sources.getExternalContext();

    const combined: Record<string, unknown> = {
      ...state,
      ...external,
    };

    return {
      history,
      state,
      external,
      combined,
    };
  }
}