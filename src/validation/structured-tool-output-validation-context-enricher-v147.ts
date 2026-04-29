import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ValidationContext {
  rawOutput: unknown;
  schema: Record<string, any>;
  executionContext: Record<string, unknown>;
}

export interface EnrichmentPayload {
  contextUpdates: Record<string, unknown>;
  validationErrors: string[];
}

type CrossFieldConstraint = {
  field: string;
  dependency: {
    sourceField: string;
    condition: (sourceValue: unknown, targetValue: unknown) => boolean;
    errorMessage: string;
  };
};

export class StructuredToolOutputValidationContextEnricher {
  enrich(context: ValidationContext): EnrichmentPayload {
    const { rawOutput, schema, executionContext } = context;
    const payload: EnrichmentPayload = {
      contextUpdates: {
        ...context.executionContext,
      },
      validationErrors: [],
    };

    if (typeof rawOutput !== "object" || rawOutput === null) {
      return payload;
    }

    const schemaConstraints: CrossFieldConstraint[] = schema?.constraints || [];

    for (const constraint of schemaConstraints) {
      const { field, dependency } = constraint;

      if (!rawOutput || typeof rawOutput !== "object") {
        continue;
      }

      const targetValue = (rawOutput as Record<string, unknown>)[field];
      const sourceValue = (rawOutput as Record<string, unknown>)[dependency.sourceField];

      if (targetValue === undefined || sourceValue === undefined) {
        continue;
      }

      if (!dependency.condition(sourceValue, targetValue)) {
        payload.validationErrors.push(
          `${field} failed cross-field validation: ${dependency.errorMessage} (Source: ${sourceValue}, Target: ${targetValue})`,
        );
      }
    }

    return payload;
  }
}