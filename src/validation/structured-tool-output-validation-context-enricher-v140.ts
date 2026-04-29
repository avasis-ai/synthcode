import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkBytesTransferred: number;
}

export interface TemporalConstraints {
  startTime: number;
  elapsedTimeMs: number;
  timeoutMs: number;
}

export interface EnrichedValidationContext {
  baseContext: {
    messages: Message[];
    schema: Record<string, any>;
  };
  resourceMetrics: ResourceMetrics;
  temporalConstraints: TemporalConstraints;
  sessionState: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly resourceMetrics: ResourceMetrics;
  private readonly temporalConstraints: TemporalConstraints;
  private readonly sessionState: Record<string, unknown>;

  constructor(
    resourceMetrics: ResourceMetrics,
    temporalConstraints: TemporalConstraints,
    sessionState: Record<string, unknown>
  ) {
    this.resourceMetrics = resourceMetrics;
    this.temporalConstraints = temporalConstraints;
    this.sessionState = sessionState;
  }

  enrich(baseContext: { messages: Message[]; schema: Record<string, any> }): EnrichedValidationContext {
    return {
      baseContext: baseContext,
      resourceMetrics: this.resourceMetrics,
      temporalConstraints: this.temporalConstraints,
      sessionState: this.sessionState,
    };
  }
}

export function createStructuredToolOutputValidationContextEnricher(
  resourceMetrics: ResourceMetrics,
  temporalConstraints: TemporalConstraints,
  sessionState: Record<string, unknown>
): StructuredToolOutputValidationContextEnricher {
  return new StructuredToolOutputValidationContextEnricher(
    resourceMetrics,
    temporalConstraints,
    sessionState
  );
}