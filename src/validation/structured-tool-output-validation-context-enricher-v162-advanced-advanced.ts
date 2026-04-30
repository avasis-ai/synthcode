import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedMetadata {
  timestamp: number;
  resource_id: string;
  lineage: {
    source: string;
    step: number;
    parent_context_id: string;
  }[];
}

export interface ValidationContext {
  messages: Message[];
  metadata: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: ValidationContext,
    advancedMetadata: AdvancedMetadata
  ): ValidationContext {
    const newContext: ValidationContext = {
      messages: context.messages,
      metadata: {
        ...context.metadata,
        advanced_metadata: advancedMetadata,
        // Optionally merge specific fields if needed, but keeping it structured is safer
      },
    };
    return newContext;
  }
}