import {
  StructuredToolOutputValidationContext,
  ValidationContext,
  ToolOutput,
  ValidationResult,
} from "./structured-tool-output-validation-context-enricher-v154";

export interface EnrichmentMetadata {
  system_mode: "operational" | "maintenance" | "testing";
  user_session_active: boolean;
  tool_execution_id: string | null;
  metadata_source: string;
}

export interface EnrichmentProvider {
  enrich(
    toolOutput: ToolOutput,
    context: ValidationContext,
  ): Promise<EnrichmentMetadata>;
}

export class StructuredToolOutputValidationContextEnricherV155 {
  private providers: EnrichmentProvider[];

  constructor(providers: EnrichmentProvider[] = []) {
    this.providers = providers;
  }

  public async enrichContext(
    toolOutput: ToolOutput,
    context: ValidationContext,
  ): Promise<{
    enrichedContext: StructuredToolOutputValidationContext;
    metadata: EnrichmentMetadata;
  }> {
    let accumulatedMetadata: Partial<EnrichmentMetadata> = {};

    for (const provider of this.providers) {
      try {
        const metadata = await provider.enrich(toolOutput, context);
        accumulatedMetadata = {
          ...accumulatedMetadata,
          ...metadata,
        };
      } catch (error) {
        console.error(
          "Error during context enrichment:",
          (error as Error).message,
        );
        // Continue with other providers even if one fails
      }
    }

    const enrichedContext: StructuredToolOutputValidationContext = {
      ...context,
      metadata: {
        ...context.metadata,
        ...accumulatedMetadata,
      } as EnrichmentMetadata,
    };

    return {
      enrichedContext,
      metadata: accumulatedMetadata as EnrichmentMetadata,
    };
  }
}

export const buildStructuredToolOutputValidationContextEnricherV155 = (
  providers: EnrichmentProvider[] = [],
): StructuredToolOutputValidationContextEnricherV155 => {
  return new StructuredToolOutputValidationContextEnricherV155(providers);
};