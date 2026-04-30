import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ResourceMetrics {
  cpu_usage_percent: number;
  memory_usage_mb: number;
  execution_time_ms: number;
}

interface ExecutionHistory {
  history_length: number;
  last_tool_call_id: string | null;
}

export interface EnrichedValidationContext {
  originalContext: any;
  resourceMetrics: ResourceMetrics;
  executionHistory: ExecutionHistory;
  enrichedMetadata: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly context: any;
  private readonly history: ExecutionHistory;
  private readonly metrics: ResourceMetrics;

  constructor(context: any, history: ExecutionHistory, metrics: ResourceMetrics) {
    this.context = context;
    this.history = history;
    this.metrics = metrics;
  }

  enrichContext(context: any): EnrichedValidationContext {
    const enrichedMetadata: Record<string, unknown> = {
      resource_metrics: this.metrics,
      execution_history: this.history,
      validation_source: "structured_tool_output_enricher_v166",
    };

    return {
      originalContext: context,
      resourceMetrics: this.metrics,
      executionHistory: this.history,
      enrichedMetadata: enrichedMetadata,
    };
  }
}