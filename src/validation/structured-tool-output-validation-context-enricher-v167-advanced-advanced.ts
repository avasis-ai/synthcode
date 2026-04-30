import { Message, ToolResultMessage } from "./types";

interface CrossFieldRule {
  field: string;
  dependsOn: string;
  validator: (currentValue: unknown, history: Message[]): boolean;
}

interface AdvancedContextEnricherContext {
  toolOutput: Record<string, unknown>;
  history: Message[];
  crossFieldRules: CrossFieldRule[];
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(context: AdvancedContextEnricherContext): { isValid: boolean; enrichedContext: Record<string, unknown>; errors: string[] } {
    const { toolOutput, history, crossFieldRules } = context;
    const errors: string[] = [];
    const enrichedContext: Record<string, unknown> = { ...toolOutput };

    for (const rule of crossFieldRules) {
      const currentValue = enrichedContext[rule.field];

      if (currentValue === undefined) {
        continue;
      }

      if (!rule.validator(currentValue, history)) {
        errors.push(`Cross-field validation failed for field "${rule.field}". Dependency check failed based on history.`);
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      enrichedContext,
      errors,
    };
  }
}