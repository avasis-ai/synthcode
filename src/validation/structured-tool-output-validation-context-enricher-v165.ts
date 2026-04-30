import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface TemporalResourceContext {
  startTime: number;
  endTime: number;
  resourceUsage: {
    cpuMs: number;
    memoryBytes: number;
  };
}

export interface ValidationContext {
  messages: Message[];
  metadata: Record<string, unknown>;
}

export interface EnrichedValidationContext extends ValidationContext {
  temporalContext: TemporalResourceContext;
}

export class StructuredToolOutputValidationContextEnricherV165 {
  enrich(
    context: ValidationContext,
    temporalContext: TemporalResourceContext
  ): EnrichedValidationContext {
    return {
      ...context,
      temporalContext: temporalContext,
    } as EnrichedValidationContext;
  }
}