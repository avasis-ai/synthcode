import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface AgentContext {
  current_state: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface HistoryPayload {
  messages: Message[];
}

export interface CurrentState {
  state_data: Record<string, unknown>;
}

export interface ContextPayload {
  history: Message[];
  current_state: Record<string, unknown>;
  metadata: Record<string, unknown>;
  aggregated_input: Record<string, unknown>;
}

export class StructuredToolInputValidationContextBuilder {
  private agentContext: AgentContext;
  private historyPayload: HistoryPayload;
  private currentState: CurrentState;

  constructor(
    agentContext: AgentContext,
    historyPayload: HistoryPayload,
    currentState: CurrentState
  ) {
    this.agentContext = agentContext;
    this.historyPayload = historyPayload;
    this.currentState = currentState;
  }

  private normalizeHistory(messages: Message[]): Message[] {
    return messages.map((msg) => {
      if ("user" in msg) {
        return msg as UserMessage;
      }
      if ("assistant" in msg) {
        return msg as AssistantMessage;
      }
      if ("tool" in msg) {
        return msg as ToolResultMessage;
      }
      return msg;
    });
  }

  private normalizeState(
    agentContext: AgentContext,
    currentState: CurrentState
  ): Record<string, unknown> {
    const mergedState: Record<string, unknown> = {
      ...agentContext.current_state,
      ...currentState.state_data,
    };
    return mergedState;
  }

  private aggregateInput(
    history: Message[],
    currentState: Record<string, unknown>
  ): Record<string, unknown> {
    let input: Record<string, unknown> = {};
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage["role"] === "user" && "content" in lastMessage) {
        input.user_input = lastMessage.content;
      }
    }
    Object.assign(input, currentState);
    return input;
  }

  public build(): ContextPayload {
    const normalizedHistory = this.normalizeHistory(this.historyPayload.messages);
    const combinedState = this.normalizeState(
      this.agentContext,
      this.currentState
    );
    const aggregatedInput = this.aggregateInput(
      normalizedHistory,
      combinedState
    );

    return {
      history: normalizedHistory,
      current_state: combinedState,
      metadata: this.agentContext.metadata,
      aggregated_input: aggregatedInput,
    };
  }
}