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

export interface AgentState {
  resourceUsage: Record<string, number>;
  activeConstraints: string[];
}

export interface EnrichedContext {
  messages: Message[];
  agentState: AgentState;
}

type ContextEnricher = (
  context: {
    messages: Message[];
    currentState: any;
  }
) => EnrichedContext;

const createStructuredToolCallValidatorContextEnricherV154AdvancedNew: ContextEnricher = (
  context: {
    messages: Message[];
    currentState: any;
  }
): EnrichedContext => {
  const agentState: AgentState = {
    resourceUsage: context.currentState.resourceUsage || {},
    activeConstraints: context.currentState.activeConstraints || [],
  };

  return {
    messages: context.messages,
    agentState: agentState,
  };
};

export {
  createStructuredToolCallValidatorContextEnricherV154AdvancedNew,
};