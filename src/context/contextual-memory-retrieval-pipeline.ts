import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface RetrievalResult {
  source: string;
  score: number;
  context: string;
}

export interface RetrievalStrategy {
  name: string;
  retrieve: (query: string, history: Message[]): Promise<RetrievalResult[]>;
}

export interface FusionWeights {
  [key: string]: number;
}

export class FusionScorer {
  private weights: FusionWeights;

  constructor(weights: FusionWeights) {
    this.weights = weights;
  }

  scoreResults(
    results: { strategyName: string; results: RetrievalResult[] }[],
  ): RetrievalResult[] {
    const combinedResultsMap = new Map<string, { score: number; context: string; source: string }>();

    for (const { strategyName, results: strategyResults } of results) {
      const weight = this.weights[strategyName] || 1.0;

      for (const result of strategyResults) {
        const combinedScore = result.score * weight;
        const combinedContext = `${result.context} `;
        const combinedSource = `${result.source} `;

        const key = `${combinedSource}:${combinedContext}`;

        if (!combinedResultsMap.has(key) || combinedScore > combinedResultsMap.get(key)!.score) {
          combinedResultsMap.set(key, {
            score: combinedScore,
            context: combinedContext,
            source: combinedSource,
          });
        }
      }
    }

    const finalResults: RetrievalResult[] = Array.from(combinedResultsMap.values()).map(
      (item) => ({
        source: item.source.trim(),
        score: item.score,
        context: item.context.trim(),
      })
    );

    return finalResults.sort((a, b) => b.score - a.score);
  }
}

export class ContextualMemoryRetriever {
  private strategies: RetrievalStrategy[];
  private scorer: FusionScorer;

  constructor(strategies: RetrievalStrategy[], weights: FusionWeights) {
    this.strategies = strategies;
    this.scorer = new FusionScorer(weights);
  }

  async retrieve(query: string, history: Message[]): Promise<RetrievalResult[]> {
    const strategyPromises: Promise<{ strategyName: string; results: RetrievalResult[] }>[] = this.strategies.map(
      async (strategy) => {
        const results = await strategy.retrieve(query, history);
        return {
          strategyName: strategy.name,
          results: results,
        };
      }
    );

    const allResults = await Promise.all(strategyPromises);

    return this.scorer.scoreResults(allResults);
  }
}