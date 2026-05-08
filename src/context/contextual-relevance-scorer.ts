import { Message, ContentBlock, TextBlock } from "./types";

export interface RelevanceScorer {
  score(chunk: Message, targetQuery: string): number;
}

export class EmbeddingScorer implements RelevanceScorer {
  score(chunk: Message, targetQuery: string): number {
    const chunkContent = this.extractText(chunk);
    const queryLength = targetQuery.length;
    const contentLength = chunkContent.length;

    if (queryLength === 0 || contentLength === 0) {
      return 0.0;
    }

    // Mocking semantic similarity: A simple heuristic based on overlap and length ratio.
    // In a real scenario, this would involve vector embeddings and cosine similarity.
    const overlapScore = Math.min(queryLength, contentLength) / Math.max(queryLength, contentLength);
    const lengthRatio = Math.sqrt(queryLength + contentLength) / 100.0;

    return (overlapScore * 0.6 + lengthRatio * 0.4);
  }

  private extractText(message: Message): string {
    if (message.role === "user") {
      return message.content;
    }
    if (message.role === "tool") {
      return message.content;
    }
    if (message.role === "assistant") {
      return message.content.map(block => {
        if (block.type === "text") {
          return block.text;
        }
        return "";
      }).join(" ");
    }
    return "";
  }
}

export class ContextualRelevanceFilter {
  private scorer: RelevanceScorer;
  private minScore: number;

  constructor(scorer: RelevanceScorer, minScore: number = 0.5) {
    this.scorer = scorer;
    this.minScore = minScore;
  }

  /**
   * Filters a list of context messages, keeping only those that meet the minimum relevance score.
   * @param contextChunks The list of context messages to evaluate.
   * @param targetQuery The current goal or query intent.
   * @returns An array of context messages deemed relevant.
   */
  filter(contextChunks: Message[], targetQuery: string): Message[] {
    if (!contextChunks || contextChunks.length === 0) {
      return [];
    }

    return contextChunks.filter(chunk => {
      const score = this.scorer.score(chunk, targetQuery);
      return score >= this.minScore;
    });
  }

  /**
   * Allows chaining multiple scoring rules (conceptually).
   * For simplicity, this implementation uses the primary scorer but demonstrates the composable pattern.
   * @param contextChunks The list of context messages to evaluate.
   * @param targetQuery The current goal or query intent.
   * @param additionalFilter A function to apply secondary, non-scoring filtering logic.
   * @returns An array of context messages deemed relevant.
   */
  filterWithComposition(
    contextChunks: Message[],
    targetQuery: string,
    additionalFilter: (chunk: Message) => boolean
  ): Message[] {
    const scoredChunks = this.filter(contextChunks, targetQuery);
    return scoredChunks.filter(additionalFilter);
  }
}

export { ContextualRelevanceFilter, EmbeddingScorer, RelevanceScorer };