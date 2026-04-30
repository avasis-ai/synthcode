import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface IntendedPathContext {
  sequence_id: string;
  intended_next_action: "tool_call" | "text_response" | "wait";
  preceding_tool_call_id?: string;
  reasoning_context: string;
}

export interface ValidationContext {
  messages: Message[];
  tool_call_context?: IntendedPathContext;
  metadata: Record<string, unknown>;
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(context: ValidationContext, intendedPath: IntendedPathContext): ValidationContext {
    if (!intendedPath) {
      return { ...context, metadata: { ...context.metadata, enrichment_warning: "IntendedPathContext missing" } };
    }

    const enrichedContext: ValidationContext = {
      messages: context.messages,
      tool_call_context: intendedPath,
      metadata: {
        ...context.metadata,
        intended_path_enriched: true,
        sequence_id: intendedPath.sequence_id,
        intended_next_action: intendedPath.intended_next_action,
        preceding_tool_call_id: intendedPath.preceding_tool_call_id,
        reasoning_context_summary: intendedPath.reasoning_context.substring(0, 100) + (intendedPath.reasoning_context.length > 100 ? "..." : ""),
      },
    };

    return enrichedContext;
  }
}