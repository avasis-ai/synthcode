import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkBytesTransferred: number;
}

export interface TemporalConstraint {
  startTimeMs: number;
  endTimeMs: number;
  deadlineMs: number;
}

export interface ContextEnrichmentPayload {
  resourceUsage: ResourceMetrics;
  temporalConstraints: TemporalConstraint[];
  systemFlags: Record<string, boolean>;
}

export interface ValidationContext {
  messages: Message[];
  toolOutput: Record<string, unknown>;
  schema: Record<string, unknown>;
  enrichmentPayload: ContextEnrichmentPayload | null;
}

export class StructuredToolOutputValidationContextEnricherV139 {
  private readonly payload: ContextEnrichmentPayload;

  constructor(payload: ContextEnrichmentPayload) {
    this.payload = payload;
  }

  enrich(context: ValidationContext): ValidationContext {
    if (!this.payload) {
      return {
        messages: context.messages,
        toolOutput: context.toolOutput,
        schema: context.schema,
        enrichmentPayload: null,
      };
    }

    return {
      messages: context.messages,
      toolOutput: context.toolOutput,
      schema: context.schema,
      enrichmentPayload: this.payload,
    };
  }
}