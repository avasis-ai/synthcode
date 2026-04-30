import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ExecutionHistory {
  messages: Message[];
  tool_results: Record<string, { content: string; is_error?: boolean }>;
}

export interface EnrichedValidationContext {
  originalContext: any;
  historyMetadata: {
    lastToolCallId: string | null;
    toolCallHistory: {
      tool_use_id: string;
      name: string;
      input: Record<string, unknown>;
      timestamp: number;
    }[];
    messageHistory: Message[];
  };
}

export class StructuredToolOutputValidationContextEnricher {
  private historyStore: ExecutionHistory;

  constructor(historyStore: ExecutionHistory) {
    this.historyStore = historyStore;
  }

  enrich(context: any, currentToolCall: { id: string; name: string; input: Record<string, unknown> }): EnrichedValidationContext {
    const enrichedContext: EnrichedValidationContext = {
      originalContext: context,
      historyMetadata: {
        lastToolCallId: null,
        toolCallHistory: [],
        messageHistory: this.historyStore.messages,
      },
    };

    const lastToolCall = this.historyStore.messages.filter((msg): msg is ToolResultMessage =>
      (msg as ToolResultMessage).role === "tool"
    ).pop();

    if (lastToolCall) {
      enrichedContext.historyMetadata.lastToolCallId = lastToolCall.tool_use_id;
    }

    const enrichedToolCallHistory = this.historyStore.messages.filter((msg): msg is ToolResultMessage =>
      (msg as ToolResultMessage).role === "tool"
    ).map((toolResultMessage: ToolResultMessage, index: number) => {
      // Simplified mapping for demonstration, assuming tool_use_id maps to a call
      return {
        tool_use_id: toolResultMessage.tool_use_id,
        name: "unknown_tool", // In a real scenario, this would be derived better
        input: {}, // Needs better derivation
        timestamp: Date.now() - (this.historyStore.messages.length - 1 - index) * 1000,
      };
    });

    enrichedContext.historyMetadata.toolCallHistory = enrichedToolCallHistory;

    // Incorporate the current tool call lineage
    enrichedContext.historyMetadata.toolCallHistory.push({
      tool_use_id: currentToolCall.id,
      name: currentToolCall.name,
      input: currentToolCall.input,
      timestamp: Date.now(),
    });

    return enrichedContext;
  }
}