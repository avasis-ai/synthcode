import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextSource {
  context: Record<string, unknown>;
  weight: number;
}

export type MergeStrategy = "weighted-average" | "first-wins" | "last-wins";

export class StructuredToolCallContextEnricher {
  private readonly mergeStrategy: MergeStrategy;

  constructor(mergeStrategy: MergeStrategy = "weighted-average") {
    this.mergeStrategy = mergeStrategy;
  }

  private fuseContext(sources: ContextSource[]): Record<string, unknown> {
    if (sources.length === 0) {
      return {};
    }

    const initialContext: Record<string, unknown> = {};

    switch (this.mergeStrategy) {
      case "first-wins":
        return sources.reduce((acc, source) => ({ ...acc, ...source.context }), {});
      case "last-wins":
        return sources.reduce((acc, source) => ({ ...acc, ...source.context }), {});
      case "weighted-average":
        return this.weightedAverageFusion(sources);
      default:
        return {};
    }
  }

  private weightedAverageFusion(sources: ContextSource[]): Record<string, unknown> {
    const aggregatedContext: Record<string, { sum: number; count: number; values: unknown[] }> = {};

    for (const source of sources) {
      for (const [key, value] of Object.entries(source.context)) {
        if (!aggregatedContext[key]) {
          aggregatedContext[key] = { sum: 0, count: 0, values: [] };
        }

        // Simple handling for numeric types for weighted average demonstration
        if (typeof value === 'number') {
          aggregatedContext[key].sum += value * source.weight;
          aggregatedContext[key].count += source.weight;
          aggregatedContext[key].values.push(value);
        } else {
          // For non-numeric types, we'll just track the presence and use a simple fallback
          // In a real scenario, this would require deep type checking and averaging logic.
          aggregatedContext[key].values.push(value);
          aggregatedContext[key].count += 1; // Treat presence as weight 1 for non-numeric
        }
      }
    }

    const result: Record<string, unknown> = {};
    for (const [key, data] of Object.entries(aggregatedContext)) {
      if (typeof data[1] === 'number' && data[1] > 0) {
        // If we detected numeric summation, calculate the average
        const average = data[0]['sum'] / data[1]['count'];
        result[key] = average;
      } else {
        // Fallback for non-numeric types: use the first encountered value
        result[key] = data[1]['values'][0];
      }
    }
    return result;
  }

  public enrichContext(sources: ContextSource[]): Record<string, unknown> {
    return this.fuseContext(sources);
  }
}