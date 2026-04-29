import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ResourceMetrics {
  cpu_usage_percent: number;
  memory_usage_bytes: number;
  network_latency_ms: number;
}

export interface TemporalConstraints {
  execution_duration_ms: number;
  timestamp_utc: number;
  deadline_ms: number;
}

export interface DependencyContext {
  dependencies: Record<string, string>;
  graph_depth: number;
}

export interface ContextEnrichmentPayload {
  resource_metrics: ResourceMetrics;
  temporal_constraints: TemporalConstraints;
  dependency_context: DependencyContext;
}

export interface ExecutionContext {
  session_id: string;
  user_id: string;
  current_timestamp: number;
}

export type ValidationContext = Record<string, unknown>;

export class StructuredToolOutputValidationContextEnricher {
  private readonly payload: ContextEnrichmentPayload;

  constructor(payload: ContextEnrichmentPayload) {
    this.payload = payload;
  }

  enrich(
    rawToolOutput: Record<string, unknown>,
    executionContext: ExecutionContext,
  ): ValidationContext {
    const baseContext: ValidationContext = {
      raw_tool_output: rawToolOutput,
      execution_context: {
        session_id: executionContext.session_id,
        user_id: executionContext.user_id,
        current_timestamp: executionContext.current_timestamp,
      },
      enrichment_payload: {
        resource_metrics: this.payload.resource_metrics,
        temporal_constraints: this.payload.temporal_constraints,
        dependency_context: this.payload.dependency_context,
      },
    };

    const enrichedContext: ValidationContext = {
      ...baseContext,
      validation_context_metadata: {
        source: "StructuredToolOutputValidationContextEnricher",
        version: "v151",
        timestamp: Date.now(),
      },
    };

    return enrichedContext;
  }
}