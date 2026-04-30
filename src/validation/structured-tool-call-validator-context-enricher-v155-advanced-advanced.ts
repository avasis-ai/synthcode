import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ResourceMetadata {
  estimatedCost: number;
  timeWindowMs: number;
}

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
}

export interface AdvancedValidationContext {
  baseContext: {
    messages: Message[];
    sessionId: string;
  };
  resourceMetadata: ResourceMetadata;
  temporalMetadata: TemporalMetadata;
  enrichedContext: {
    resourceUsageMetrics: {
      estimatedCost: number;
      timeWindowMs: number;
    };
    temporalConstraints: {
      startTime: number;
      endTime: number;
    };
    isResourceConstrained: boolean;
    isTimeConstrained: boolean;
  };
}

export class StructuredToolCallValidatorContextEnricher {
  enrich(
    baseContext: {
      messages: Message[];
      sessionId: string;
    },
    resourceMetadata: ResourceMetadata,
    temporalMetadata: TemporalMetadata
  ): AdvancedValidationContext {
    const enrichedContext: {
      resourceUsageMetrics: {
        estimatedCost: number;
        timeWindowMs: number;
      };
      temporalConstraints: {
        startTime: number;
        endTime: number;
      };
      isResourceConstrained: boolean;
      isTimeConstrained: boolean;
    } = {
      resourceUsageMetrics: {
        estimatedCost: resourceMetadata.estimatedCost,
        timeWindowMs: resourceMetadata.timeWindowMs,
      },
      temporalConstraints: {
        startTime: temporalMetadata.startTime,
        endTime: temporalMetadata.endTime,
      },
      isResourceConstrained: resourceMetadata.estimatedCost > 0,
      isTimeConstrained: temporalMetadata.endTime > temporalMetadata.startTime,
    };

    return {
      baseContext: baseContext,
      resourceMetadata: resourceMetadata,
      temporalMetadata: temporalMetadata,
      enrichedContext: enrichedContext,
    };
  }
}