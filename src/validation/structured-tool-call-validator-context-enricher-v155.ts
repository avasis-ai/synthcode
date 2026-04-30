import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface DependencyContext {
  source_message_id: string;
  intended_path: string;
  required_dependencies: string[];
}

export interface EnrichedValidationContext {
  original_context: {
    messages: Message[];
    last_tool_call: ToolUseBlock | null;
  };
  tool_call_to_validate: ToolUseBlock;
  dependency_context: DependencyContext;
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    context: {
      messages: Message[];
      last_tool_call: ToolUseBlock | null;
    },
    toolCall: ToolUseBlock,
    dependencyContext: DependencyContext
  ): EnrichedValidationContext {
    return {
      original_context: context,
      tool_call_to_validate: toolCall,
      dependency_context: dependencyContext,
    };
  }
}