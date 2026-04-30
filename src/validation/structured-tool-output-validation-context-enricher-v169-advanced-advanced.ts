import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface IHistorySource {
  enrich(context: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface IStateSource {
  enrich(context: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface INodeSource {
  enrich(context: Record<string, unknown>): Promise<Record<string, unknown>>;
}

type SourceEnricher = IHistorySource | IStateSource | INodeSource;

interface EnrichmentConfig {
  [key: string]: {
    source: SourceEnricher;
    weight: number;
    filter?: (context: Record<string, unknown>, enrichment: Record<string, unknown>) => boolean;
  };
}

export class AdvancedContextEnricher {
  private sources: Map<string, SourceEnricher>;
  private config: EnrichmentConfig;

  constructor(sources: SourceEnricher[], config: EnrichmentConfig) {
    this.sources = new Map();
    sources.forEach((source, index) => {
      // Simple mapping for demonstration; in a real scenario, source identification would be more robust.
      this.sources.set(`source_${index}`, source);
    });
    this.config = config;
  }

  private async enrichSource(
    source: SourceEnricher,
    context: Record<string, unknown>,
    weight: number,
    filter?: (context: Record<string, unknown>, enrichment: Record<string, unknown>) => boolean
  ): Promise<Record<string, unknown>> {
    let enrichment: Record<string, unknown> = {};
    try {
      let result: Record<string, unknown>;
      if ('enrich' in source) {
        result = await (source as any).enrich(context);
      } else {
        result = {};
      }

      if (filter) {
        if (!filter(context, result)) {
          return {};
        }
      }
      return result;
    } catch (error) {
      console.error("Enrichment failed for a source:", error);
      return {};
    }
  }

  public async enrich(
    baseContext: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    let accumulatedContext: Record<string, unknown> = { ...baseContext };
    const promises: Promise<Record<string, unknown>>[] = [];

    for (const key in this.config) {
      const configEntry = this.config[key];
      const source = configEntry.source;
      const weight = configEntry.weight;
      const filter = configEntry.filter;

      if (source && weight > 0) {
        promises.push(
          this.enrichSource(source, accumulatedContext, weight, filter).then(enriched => ({
            key: key,
            weight: weight,
            enrichment: enriched,
          }))
        );
      }
    }

    const results = await Promise.all(promises);

    const finalContext: Record<string, unknown> = { ...baseContext };

    for (const result of results) {
      const { key, weight, enrichment } = result;
      if (Object.keys(enrichment).length > 0) {
        // Simple weighted merge: Overwrite existing keys if the new value is "better" (e.g., non-null, or just merge)
        // For simplicity, we merge all properties from the enrichment, potentially overwriting base context.
        Object.assign(finalContext, enrichment);
      }
    }

    return finalContext;
  }
}