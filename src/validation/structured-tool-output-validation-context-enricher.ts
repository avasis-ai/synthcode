import { Context, ValidationContext, Message } from "./validation-context";

export interface ContextEnrichmentPayload {
  context: ValidationContext;
  sourceContext: Record<string, unknown>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(payload: ContextEnrichmentPayload): ValidationContext {
    const { context, sourceContext } = payload;

    const enrichedContext: ValidationContext = {
      ...context,
      metadata: {
        ...context.metadata,
        ...sourceContext,
      },
    };

    return enrichedContext;
  }
}