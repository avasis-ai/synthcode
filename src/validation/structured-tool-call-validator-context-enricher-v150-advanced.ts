import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ContextEnrichmentReport {
  source: string;
  merged_data: Record<string, unknown>;
  conflicts_resolved: Record<string, { source_value: unknown; resolved_value: unknown }>;
}

export interface IContextProvider {
  name: string;
  enrichContext(context: Record<string, unknown>, history: Message[]): Promise<{ context: Record<string, unknown>; report: ContextEnrichmentReport }>;
}

export class StructuredToolCallValidatorContextEnricher {
  private providers: IContextProvider[];

  constructor(providers: IContextProvider[]) {
    this.providers = providers;
  }

  public async enrichContext(
    initialContext: Record<string, unknown>,
    history: Message[]
  ): Promise<{ enrichedContext: Record<string, unknown>; report: ContextEnrichmentReport[] }> {
    let currentContext: Record<string, unknown> = { ...initialContext };
    const reports: ContextEnrichmentReport[] = [];

    for (const provider of this.providers) {
      const { context: enrichedContext, report } = await provider.enrichContext(currentContext, history);
      
      const mergedReport: ContextEnrichmentReport = {
        source: provider.name,
        merged_data: enrichedContext,
        conflicts_resolved: report.conflicts_resolved,
      };
      
      reports.push(mergedReport);
      currentContext = enrichedContext;
    }

    return {
      enrichedContext: currentContext,
      report: reports,
    };
  }
}