import { Message } from "./types";

export type Strategy = (context: Message[], contextId: string) => Promise<{
  result: Message;
  metrics: Record<string, number>;
}>;

export type ComparisonCriteria = "lowest_cost" | "fastest" | "highest_success_rate";

export interface StrategyResult {
  strategyName: string;
  finalMessage: Message;
  metrics: {
    cost: number;
    timeMs: number;
    successRate: number;
    contextUsage: number;
  };
}

export class StrategyComparisonManager {
  private strategies: Map<string, Strategy>;

  constructor(strategies: Record<string, Strategy>) {
    this.strategies = new Map(Object.entries(strategies));
  }

  /**
   * Executes all registered strategies against the given context.
   * @param context The initial conversation history.
   * @param contextId A unique identifier for the run.
   * @returns A promise resolving to an array of StrategyResult objects.
   */
  public async runComparison(context: Message[], contextId: string): Promise<StrategyResult[]> {
    const executionPromises: Promise<StrategyResult>[] = [];

    for (const [name, strategy] of this.strategies) {
      const promise = (async () => {
        try {
          const { result, metrics } = await strategy(context, contextId);
          return {
            strategyName: name,
            finalMessage: result,
            metrics: {
              cost: metrics.cost || 0,
              timeMs: metrics.timeMs || 0,
              successRate: metrics.successRate || 0,
              contextUsage: metrics.contextUsage || 0,
            },
          };
        } catch (error) {
          console.error(`Strategy ${name} failed:`, error);
          return {
            strategyName: name,
            finalMessage: null as any,
            metrics: {
              cost: Infinity,
              timeMs: Infinity,
              successRate: 0,
              contextUsage: 0,
            },
          };
        }
      })();
      executionPromises.push(promise);
    }

    return Promise.all(executionPromises);
  }

  /**
   * Calculates a weighted score for each strategy based on the comparison criteria.
   * @param results The results from the runComparison.
   * @param criteria The metric to prioritize.
   * @returns An array of results sorted by the calculated score (best first).
   */
  public compareStrategies(results: StrategyResult[], criteria: ComparisonCriteria): {
    rankedResults: Array<{ result: StrategyResult; score: number }>;
    bestStrategyName: string | null;
  } {
    const scoredResults = results.map(result => {
      let score: number;

      switch (criteria) {
        case "lowest_cost":
          // Lower cost is better, so we use the inverse or a negative value for sorting
          score = -result.metrics.cost;
          break;
        case "fastest":
          score = -result.metrics.timeMs;
          break;
        case "highest_success_rate":
          score = result.metrics.successRate;
          break;
        default:
          score = 0;
      }
      return { result, score };
    });

    // Sort descending by score (highest score first)
    scoredResults.sort((a, b) => b.score - a.score);

    const bestStrategyName = scoredResults.length > 0 ? scoredResults[0].result.strategyName : null;

    return {
      rankedResults: scoredResults,
      bestStrategyName: bestStrategyName,
    };
  }
}