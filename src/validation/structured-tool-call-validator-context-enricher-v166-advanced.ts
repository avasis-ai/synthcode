import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AgentState {
  current_user_id: string;
  session_metadata: Record<string, any>;
  last_action_successful: boolean;
}

export interface GlobalConstraints {
  max_tool_calls: number;
  allowed_tools: string[];
  system_directives: string;
}

export interface AdvancedContext {
  agent_state: AgentState;
  global_constraints: GlobalConstraints;
  recent_history_summary: string;
}

export interface EnrichedContext {
  base_messages: Message[];
  advanced_context: AdvancedContext;
  derived_context: {
    is_tool_call_allowed: boolean;
    suggested_next_action: string;
    context_summary: string;
  };
}

export class StructuredToolCallValidatorContextEnricher {
  private baseContext: Message[];
  private advancedContext: AdvancedContext;

  constructor(baseContext: Message[], advancedContext: AdvancedContext) {
    this.baseContext = baseContext;
    this.advancedContext = advancedContext;
  }

  enrich(): EnrichedContext {
    const { agent_state, global_constraints, recent_history_summary } = this.advancedContext;

    const isToolCallAllowed = global_constraints.allowed_tools.length > 0 &&
                              agent_state.last_action_successful;

    const suggestedNextAction = this.deriveNextAction(
      this.baseContext,
      agent_state,
      recent_history_summary
    );

    const contextSummary = this.generateContextSummary(
      this.baseContext,
      agent_state,
      global_constraints.system_directives
    );

    return {
      base_messages: this.baseContext,
      advanced_context: this.advancedContext,
      derived_context: {
        is_tool_call_allowed: isToolCallAllowed,
        suggested_next_action: suggestedNextAction,
        context_summary: contextSummary,
      },
    };
  }

  private deriveNextAction(
    messages: Message[],
    state: AgentState,
    historySummary: string
  ): string {
    if (!state.last_action_successful) {
      return "Awaiting successful action confirmation before proceeding with tool calls.";
    }

    if (messages.length === 0) {
      return "No prior messages found; requires initial user input.";
    }

    if (historySummary.includes("Error")) {
      return "Review recent errors in history before attempting new tool calls.";
    }

    return "Context seems stable; ready for potential tool invocation.";
  }

  private generateContextSummary(
    messages: Message[],
    state: AgentState,
    directives: string
  ): string {
    let summary = `System Directives: ${directives}. `;
    summary += `Agent ID: ${state.current_user_id}. `;
    summary += `Last Success: ${state.last_action_successful ? 'Yes' : 'No'}. `;

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        summary += `Last User Input: "${(lastMessage as UserMessage).content.substring(0, 30)}..."`;
      } else if (lastMessage.role === "assistant") {
        summary += `Last Assistant Output: ${lastMessage.content.length} blocks.`;
      }
    } else {
      summary += "No message history available.";
    }
    return summary;
  }
}

export { StructuredToolCallValidatorContextEnricher };