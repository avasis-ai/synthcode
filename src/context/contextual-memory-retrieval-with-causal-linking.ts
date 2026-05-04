import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CausalLink {
  sourceMessageId: string;
  targetMessageId: string;
  causalRelationship: "causes" | "is_caused_by" | "supports";
  strength: number;
  description: string;
}

export interface ContextualMemoryRetrievalContext {
  query: string;
  history: Message[];
  causalLinks: CausalLink[];
}

export class ContextualMemoryRetriever {
  private readonly embeddingModel: (text: string) => Float32Array;

  constructor(embeddingModel: (text: string) => Float32Array) {
    this.embeddingModel = embeddingModel;
  }

  private calculateSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      sum += vecA[i] * vecB[i];
    }
    return Math.sqrt(sum);
  }

  private generateContextVector(context: string): Float32Array {
    return this.embeddingModel(context);
  }

  private scoreContext(
    contextChunk: string,
    context: ContextualMemoryRetrievalContext
  ): { score: number; causalScore: number; chunk: string } {
    const contextVector = this.generateContextVector(context.query);
    const chunkVector = this.generateContextVector(contextChunk);

    const similarity = this.calculateSimilarity(contextVector, chunkVector);

    let causalScore = 0;
    for (const link of context.causalLinks) {
      if (link.description.includes(contextChunk.substring(0, 20))) {
        if (link.causalRelationship === "supports") {
          causalScore += link.strength * 0.5;
        } else if (link.causalRelationship === "causes") {
          causalScore += link.strength * 1.5;
        }
      }
    }

    return {
      score: similarity,
      causalScore: causalScore,
      chunk: contextChunk,
    };
  }

  retrieve(
    query: string,
    history: Message[],
    causalLinks: CausalLink[],
    availableContexts: string[]
  ): { bestContext: string; finalScore: number } | null {
    if (!availableContexts || availableContexts.length === 0) {
      return null;
    }

    const context: ContextualMemoryRetrievalContext = {
      query,
      history,
      causalLinks,
    };

    const scoredResults = availableContexts.map(contextChunk =>
      this.scoreContext(contextChunk, context)
    );

    let bestResult = null;
    let maxScore = -1;

    for (const result of scoredResults) {
      // Weighted combination: 70% Similarity, 30% Causal Link Strength
      const finalScore = (result.score * 0.7) + (result.causalScore * 0.3);

      if (finalScore > maxScore) {
        maxScore = finalScore;
        bestResult = {
          bestContext: result.chunk,
          finalScore: finalScore,
        };
      }
    }

    return bestResult;
  }
}