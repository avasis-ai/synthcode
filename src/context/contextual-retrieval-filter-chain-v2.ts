import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface RetrievalContext {
  messages: Message[];
  metadata: Record<string, any>;
  query: string;
}

export interface FilteredContext extends RetrievalContext {
  filteredMetadata: Record<string, any>;
  relevanceScoreBoost: number;
}

export interface ContextualFilter {
  name: string;
  execute: (context: RetrievalContext) => {
    filteredContext: FilteredContext;
    success: boolean;
    error?: string;
  };
}

export class ContextualRetrievalFilterChain {
  private filters: ContextualFilter[];

  constructor(filters: ContextualFilter[]) {
    this.filters = filters;
  }

  public execute(initialContext: RetrievalContext): {
    finalContext: FilteredContext;
    success: boolean;
    error?: string;
  } {
    let currentContext: RetrievalContext = initialContext;
    let currentFilteredContext: FilteredContext = {
      messages: initialContext.messages,
      metadata: initialContext.metadata,
      query: initialContext.query,
      filteredMetadata: initialContext.metadata,
      relevanceScoreBoost: 0,
    };

    for (const filter of this.filters) {
      const result = filter.execute(currentContext);

      if (!result.success) {
        return {
          finalContext: currentFilteredContext,
          success: false,
          error: result.error,
        };
      }

      currentFilteredContext = result.filteredContext;
      currentContext = {
        messages: currentContext.messages,
        metadata: currentContext.metadata,
        query: currentContext.query,
      };
    }

    return {
      finalContext: currentFilteredContext,
      success: true,
    };
  }
}