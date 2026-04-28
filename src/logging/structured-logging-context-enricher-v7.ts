import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceMetrics {
  cpu_usage_percent: number;
  memory_usage_bytes: number;
  duration_ms: number;
}

export interface EnrichedLogContext {
  timestamp: number;
  resource_metrics: ResourceMetrics;
  context: Record<string, unknown>;
  message: Message;
}

type ContextEnricher = (
  context: Record<string, unknown>
) => (
  message: Message,
  resourceMetrics: ResourceMetrics
) => EnrichedLogContext;

const createContextEnricherV7: ContextEnricher = (
  initialContext
): ContextEnricher => {
  return (message, resourceMetrics) => {
    const enrichedContext: EnrichedLogContext = {
      timestamp: Date.now(),
      resource_metrics: resourceMetrics,
      context: {
        ...initialContext,
        // Add any other context fields here if needed
      },
      message: message,
    };
    return enrichedContext;
  };
};

export {
  createContextEnricherV7,
  EnrichedLogContext,
  ResourceMetrics,
};