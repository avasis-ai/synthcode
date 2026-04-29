import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkLatencyMs: number;
}

export interface TemporalConstraints {
  startTime: number;
  deadlineMs: number;
}

export interface EnrichedContext {
  messages: Message[];
  resourceMetrics: ResourceMetrics;
  temporalConstraints: TemporalConstraints;
}

interface ExecutionContext {
  resourceMetrics: ResourceMetrics;
  temporalConstraints: TemporalConstraints;
  messages: Message[];
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(context: ExecutionContext): EnrichedContext {
    return {
      messages: context.messages,
      resourceMetrics: context.resourceMetrics,
      temporalConstraints: context.temporalConstraints,
    };
  }
}

export const createEnrichedContext = (
  context: ExecutionContext
): EnrichedContext => {
  const enricher = new StructuredToolCallValidatorContextEnricher();
  return enricher.enrich(context);
};