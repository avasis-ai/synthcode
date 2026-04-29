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

export interface ValidationContext {
  messages: Message[];
  metadata: Record<string, unknown>;
}

export interface EnrichmentMetadata {
  [key: string]: unknown;
}

export class StructuredToolOutputValidationContextEnricher {
  private metadata: EnrichmentMetadata;

  constructor(metadata: EnrichmentMetadata) {
    this.metadata = metadata;
  }

  enrich(context: ValidationContext): ValidationContext {
    return {
      ...context,
      metadata: {
        ...context.metadata,
        ...this.metadata,
      },
    };
  }
}