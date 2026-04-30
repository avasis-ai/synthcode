import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface IntendedExecutionContext {
  intended_path: string;
  potential_side_effects: {
    action: string;
    risk_level: "low" | "medium" | "high";
    description: string;
  }[];
}

export interface ValidationContext {
  messages: Message[];
  tool_call_context: Record<string, any>;
  intended_context: IntendedExecutionContext;
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    context: { messages: Message[]; tool_call_context: Record<string, any> },
    intendedContext: IntendedExecutionContext
  ): ValidationContext {
    return {
      messages: context.messages,
      tool_call_context: context.tool_call_context,
      intended_context: intendedContext,
    };
  }
}