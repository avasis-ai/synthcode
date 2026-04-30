import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type Context = {
  messages: Message[];
  initialContext: Record<string, unknown>;
};

export interface EnrichmentStep {
  name: string;
  enricher: (context: Context) => Promise<{ enrichedContext: Context; success: boolean; reason?: string }>;
}

export class StructuredToolCallValidatorContextEnricherAdvanced {
  private enrichments: EnrichmentStep[];

  constructor(enrichments: EnrichmentStep[]) {
    this.enrichments = enrichments;
  }

  private async executeStep(context: Context, step: EnrichmentStep): Promise<{ enrichedContext: Context; success: boolean; reason?: string }> {
    try {
      const result = await step.enricher(context);
      return {
        enrichedContext: result.enrichedContext,
        success: true,
        reason: undefined,
      };
    } catch (error) {
      return {
        enrichedContext: context,
        success: false,
        reason: `Error during ${step.name} enrichment: ${(error as Error).message}`,
      };
    }
  }

  public async enrichContext(context: Context): Promise<{ finalContext: Context; success: boolean; reason?: string }> {
    let currentContext: Context = { ...context };
    let overallSuccess = true;
    let lastFailureReason: string | undefined = undefined;

    for (const step of this.enrichments) {
      const result = await this.executeStep(currentContext, step);

      if (!result.success) {
        overallSuccess = false;
        lastFailureReason = result.reason;
        // Continue processing to gather as much context as possible, but mark failure
      }
      currentContext = result.enrichedContext;
    }

    return {
      finalContext: currentContext,
      success: overallSuccess,
      reason: lastFailureReason,
    };
  }
}

export const createAdvancedContextEnricher = (
  temporalEnricher: (context: Context) => Promise<{ enrichedContext: Context; success: boolean; reason?: string }>,
  resourceConstraintEnricher: (context: Context) => Promise<{ enrichedContext: Context; success: boolean; reason?: string }>,
): StructuredToolCallValidatorContextEnricherAdvanced => {
  const enrichments: EnrichmentStep[] = [
    {
      name: "TemporalContextEnricher",
      enricher: temporalEnricher,
    },
    {
      name: "ResourceConstraintEnricher",
      enricher: resourceConstraintEnricher,
    },
    // Add more steps here as needed
  ];
  return new StructuredToolCallValidatorContextEnricherAdvanced(enrichments);
};