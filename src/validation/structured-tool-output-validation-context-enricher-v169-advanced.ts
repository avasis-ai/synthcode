import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface AgentState {
  [key: string]: any;
}

export interface ExecutionHistory {
  messages: Message[];
  state: AgentState;
}

export interface EnrichedContext {
  originalHistory: ExecutionHistory;
  metadata: Record<string, any>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(history: ExecutionHistory): EnrichedContext {
    const metadata: Record<string, any> = this.extractMetadataFromHistory(history);

    return {
      originalHistory: history,
      metadata: metadata,
    };
  }

  private extractMetadataFromHistory(history: ExecutionHistory): Record<string, any> {
    const metadata: Record<string, any> = {
      lastToolResult: null,
      stateChanges: [],
      userIntentSummary: "",
    };

    let lastToolResult: ToolResultMessage | undefined = undefined;

    for (const message of history.messages) {
      if (message.role === "tool" && (message as ToolResultMessage).tool_use_id) {
        lastToolResult = message as ToolResultMessage;
        metadata.lastToolResult = {
          result: lastToolResult.content,
          isError: lastToolResult.is_error,
        };
      } else if (message.role === "user") {
        // Simple summary extraction for demonstration
        metadata.userIntentSummary = message.content.substring(0, 100).trim();
      }
    }

    // Simulate state change tracking (simplified)
    // In a real scenario, this would involve deep diffing or explicit state logging
    const initialAgentState = JSON.stringify(history.state);
    let currentState = history.state;

    // For this example, we just record the initial state and assume any subsequent
    // tool result implies a potential state change context.
    metadata.stateChanges.push({
      initialStateSnapshot: initialAgentState,
      lastKnownState: JSON.stringify(currentState),
    });

    return metadata;
  }
}