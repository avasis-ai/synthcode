import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpu_time_ms: number;
  memory_usage_bytes: number;
  network_latency_ms: number;
}

export interface HistoryStep {
  step_id: string;
  timestamp: number;
  message: Message;
  resource_usage: ResourceUsage;
}

export interface EnrichedContext {
  base_context: {
    messages: Message[];
    current_tool_call: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    } | null;
  };
  history: HistoryStep[];
  resource_metrics: ResourceUsage;
}

export class StructuredToolCallValidatorContextEnricherV145 {
  enrich(
    baseContext: {
      messages: Message[];
      current_tool_call: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      } | null;
    },
    history: HistoryStep[],
    resourceMetrics: ResourceUsage
  ): EnrichedContext {
    return {
      base_context: baseContext,
      history: history,
      resource_metrics: resourceMetrics,
    };
  }
}