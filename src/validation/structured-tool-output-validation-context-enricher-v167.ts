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

export interface ResourceMetrics {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  executionDurationMs: number;
}

export interface ValidationContext {
  messages: Message[];
  toolOutput: any;
  metadata?: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    rawToolOutput: any,
    context: ValidationContext,
    metrics: ResourceMetrics
  ): ValidationContext {
    const enrichedContext: ValidationContext = {
      ...context,
      toolOutput: rawToolOutput,
      metadata: {
        ...(context.metadata || {}),
        resourceMetrics: metrics,
        enrichmentSource: "StructuredToolOutputValidationContextEnricher",
        timestamp: Date.now(),
      },
    };
    return enrichedContext;
  }
}