import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface PlanContext {
  plan_id: string;
  steps: Array<{
    step_index: number;
    expected_tool_name: string;
    expected_input_schema: Record<string, any>;
  }>;
}

export interface EnrichedValidationContext {
  message_history: Message[];
  current_user_input: string;
  expected_next_step?: {
    tool_name: string;
    required_input: Record<string, any>;
  };
  plan_context?: PlanContext;
}

export class StructuredToolCallValidationContextEnricher {
  enrich(
    context: {
      message_history: Message[];
      current_user_input: string;
      plan_context?: PlanContext;
      expected_next_step?: {
        tool_name: string;
        required_input: Record<string, any>;
      };
    }
  ): EnrichedValidationContext {
    const {
      message_history,
      current_user_input,
      plan_context,
      expected_next_step,
    } = context;

    return {
      message_history,
      current_user_input,
      expected_next_step,
      plan_context,
    };
  }
}