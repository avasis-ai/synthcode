import { ContextManager } from "./context-manager";
import { StateDiffCalculator } from "./state-diff-calculator";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ToolCallRequest = {
  tool_name: string;
  tool_input: Record<string, unknown>;
};

export interface EnrichedContext {
  historySummary: string;
  currentStateDiff: Record<string, any>;
  activeConstraints: Record<string, any>;
  recentMessages: Message[];
}

export class ContextualToolCallValidatorContextEnricher {
  private contextManager: ContextManager;
  private stateDiffCalculator: StateDiffCalculator;

  constructor(
    contextManager: ContextManager,
    stateDiffCalculator: StateDiffCalculator
  ) {
    this.contextManager = contextManager;
    this.stateDiffCalculator = stateDiffCalculator;
  }

  enrichContext(
    toolCallRequest: ToolCallRequest,
    history: Message[],
    currentState: Record<string, any>
  ): EnrichedContext {
    const historySummary = this.contextManager.summarizeHistory(history);
    const currentStateDiff = this.stateDiffCalculator.calculateDiff(currentState);
    const activeConstraints = this.contextManager.getActiveConstraints();
    const recentMessages = history.slice(-5);

    return {
      historySummary,
      currentStateDiff,
      activeConstraints,
      recentMessages,
    };
  }
}