import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkBytesTransferred: number;
}

export interface TemporalContext {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface ExecutionContext {
  resourceMetrics: ResourceMetrics;
  temporalContext: TemporalContext;
}

export interface EnrichedValidationContext {
  messages: Message[];
  toolOutput: Record<string, string>;
  executionContext: ExecutionContext;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: {
      messages: Message[];
      toolOutput: Record<string, string>;
    },
    executionContext: ExecutionContext
  ): EnrichedValidationContext {
    return {
      messages: context.messages,
      toolOutput: context.toolOutput,
      executionContext: executionContext,
    };
  }
}