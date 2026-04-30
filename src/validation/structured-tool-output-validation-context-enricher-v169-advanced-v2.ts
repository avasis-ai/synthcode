import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationContext = Record<string, unknown>;

export interface EnrichmentStep {
  name: string;
  condition?: (context: ValidationContext) => boolean;
  enricher: (context: ValidationContext, previousResult: Record<string, unknown>) => Record<string, unknown>;
}

export interface StructuredToolOutputValidationContextEnricher {
  enrichSteps: EnrichmentStep[];
  enrich: (initialContext: ValidationContext, previousResults: Record<string, unknown>) => ValidationContext;
}

export class StructuredToolOutputValidationContextEnricherV169AdvancedV2 implements StructuredToolOutputValidationContextEnricher {
  constructor(enrichSteps: EnrichmentStep[]) {
    this.enrichSteps = enrichSteps;
  }

  enrich(initialContext: ValidationContext, previousResults: Record<string, unknown>): ValidationContext {
    let currentContext: ValidationContext = { ...initialContext };
    let accumulatedResults: Record<string, unknown> = { ...previousResults };

    for (const step of this.enrichSteps) {
      if (step.condition && !step.condition(currentContext)) {
        continue;
      }

      try {
        const stepResult = step.enricher(currentContext, accumulatedResults);
        currentContext = { ...currentContext, ...stepResult };
        accumulatedResults = { ...accumulatedResults, [step.name]: stepResult };
      } catch (error) {
        console.error(`Error executing enrichment step "${step.name}":`, error);
        // Decide how to handle failure: stop, or continue with partial context
        // For this implementation, we log and continue, preserving the context up to the failure point.
      }
    }

    return currentContext;
  }
}