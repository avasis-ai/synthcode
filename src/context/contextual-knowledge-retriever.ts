import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Context {
  history: Message[];
  currentQuery: string;
  state: Record<string, any>;
}

export interface ContextSource {
  name: string;
  retrieve: (query: string, context: Context) => Promise<{ source: string; contextPayload: Record<string, unknown>; score: number }>;
}

export interface FusionStrategy {
  fuse: (results: { source: string; contextPayload: Record<string, unknown>; score: number }[]) => Record<string, unknown>;
}

export class ContextualKnowledgeRetriever {
  private sources: ContextSource[];
  private fusionStrategy: FusionStrategy;

  constructor(sources: ContextSource[], fusionStrategy: FusionStrategy) {
    this.sources = sources;
    this.fusionStrategy = fusionStrategy;
  }

  public async retrieve(query: string, context: Context): Promise<{ fusedContext: Record<string, unknown>; finalScore: number }> {
    const retrievalPromises = this.sources.map(source =>
      source.retrieve(query, context).then(result => ({
        source: result.source,
        contextPayload: result.contextPayload,
        score: result.score,
      }))
    );

    const results = await Promise.all(retrievalPromises);

    const fusedContext = this.fusionStrategy.fuse(results);

    // Simple weighted average for final score approximation
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const finalScore = results.length > 0 ? totalScore / results.length : 0;

    return { fusedContext, finalScore };
  }
}

export const createWeightedAverageFusionStrategy: FusionStrategy = {
  fuse: (results) => {
    const combinedContext: Record<string, unknown> = {};
    for (const result of results) {
      Object.assign(combinedContext, result.contextPayload);
    }
    return combinedContext;
  },
};

export const createSimpleAveragingFusionStrategy: FusionStrategy = {
  fuse: (results) => {
    const combinedContext: Record<string, unknown> = {};
    for (const result of results) {
      Object.assign(combinedContext, result.contextPayload);
    }
    return combinedContext;
  },
};