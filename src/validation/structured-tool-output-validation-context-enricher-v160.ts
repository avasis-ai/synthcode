import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ResourceContext {
  cpuUsage?: number;
  memoryFootprint?: number;
  executionTimeMs?: number;
  startTime?: number;
  endTime?: number;
}

export interface ValidationContext {
  messages: Message[];
  metadata: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricherV160 {
  private resourceContext: ResourceContext;

  constructor(resourceContext: ResourceContext) {
    this.resourceContext = resourceContext;
  }

  enrich(context: ValidationContext): ValidationContext {
    const newMetadata = {
      ...context.metadata,
      resourceMetrics: {
        cpuUsage: this.resourceContext.cpuUsage,
        memoryFootprint: this.resourceContext.memoryFootprint,
        executionTimeMs: this.resourceContext.executionTimeMs,
        startTime: this.resourceContext.startTime,
        endTime: this.resourceContext.endTime,
      },
    };

    return {
      messages: context.messages,
      metadata: newMetadata,
    };
  }
}