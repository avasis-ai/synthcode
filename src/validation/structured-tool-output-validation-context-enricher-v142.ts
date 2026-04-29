import { ExecutionContext, ValidationContext } from "./validation-context-types";

export interface ContextEnrichmentPayload {
  resourceUsage?: {
    cpuMs: number;
    memoryBytes: number;
    networkBytes: number;
  };
  temporalConstraint?: {
    startTime: number;
    endTime: number;
    maxDurationMs: number;
  };
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: ValidationContext,
    executionContext: ExecutionContext,
    enrichmentPayload: ContextEnrichmentPayload
  ): ValidationContext {
    const enrichedContext: ValidationContext = {
      ...context,
      metadata: {
        ...context.metadata,
        ...enrichmentPayload,
      },
    };

    return enrichedContext;
  }
}