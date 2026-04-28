import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextChunk = {
  content: Message;
  timestamp: number;
};

type Directive = {
  type: "user" | "system";
  content: string;
  weight: number;
};

class SemanticContextMergerV2 {
  private readonly K: number;
  private readonly SEMANTIC_WEIGHT: number;
  private readonly TEMPORAL_DECAY_RATE: number;

  constructor(k: number = 3, semanticWeight: number = 0.5, temporalDecayRate: number = 0.01) {
    this.K = k;
    this.SEMANTIC_WEIGHT = semanticWeight;
    this.TEMPORAL_DECAY_RATE = temporalDecayRate;
  }

  private calculateCosineSimilarity(text1: string, text2: string): number {
    const tokenize = (text: string): Set<string> => new Set(text.toLowerCase().match(/\w+/g) || []);
    const set1 = tokenize(text1);
    const set2 = tokenize(text2);

    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const unionSize = set1.size + set2.size - intersection.size;

    if (unionSize === 0) return 0;

    const similarity = Math.sqrt(
      (intersection.size / set1.size) * (intersection.size / set2.size)
    );
    return similarity;
  }

  private calculateScore(
    chunk: ContextChunk,
    referenceContent: string,
    currentTime: number
  ): number {
    const semanticScore = this.calculateCosineSimilarity(
      chunk.content.content,
      referenceContent
    ) * this.SEMANTIC_WEIGHT;

    const timeDifference = currentTime - chunk.timestamp;
    const temporalScore = Math.exp(-this.TEMPORAL_DECAY_RATE * timeDifference);

    return semanticScore + temporalScore;
  }

  private calculateDirectiveScore(directive: Directive, referenceContent: string): number {
    const semanticScore = this.calculateCosineSimilarity(
      directive.content,
      referenceContent
    ) * this.SEMANTIC_WEIGHT * 0.5; // Directives are weighted less on pure similarity

    return semanticScore + directive.weight;
  }

  public mergeContext(
    contextChunks: ContextChunk[],
    directives: Directive[],
    referenceContent: string,
    currentTime: number
  ): string {
    if (contextChunks.length === 0 && directives.length === 0) {
      return "";
    }

    const scoredChunks: { chunk: ContextChunk; score: number }[] = [];
    for (const chunk of contextChunks) {
      const score = this.calculateScore(chunk, referenceContent, currentTime);
      scoredChunks.push({ chunk, score });
    }

    const scoredDirectives: { directive: Directive; score: number }[] = [];
    for (const directive of directives) {
      const score = this.calculateDirectiveScore(directive, referenceContent);
      scoredDirectives.push({ directive, score });
    }

    const allCandidates: { content: string; score: number }[] = [];

    // Combine chunks and directives for ranking
    scoredChunks.forEach(({ chunk, score }) => {
      allCandidates.push({ content: chunk.content.content, score: score });
    });

    scoredDirectives.forEach(({ directive, score }) => {
      allCandidates.push({ content: directive.content, score: score });
    });

    // Sort and select top K unique content pieces
    allCandidates.sort((a, b) => b.score - a.score);

    const selectedContents: Set<string> = new Set();
    const finalSelection: string[] = [];

    for (const candidate of allCandidates) {
      if (selectedContents.has(candidate.content)) {
        continue;
      }
      if (finalSelection.length >= this.K && candidate.score < allCandidates[this.K - 1].score * 0.8) {
        break; // Stop if score drops significantly below the K-th element
      }
      finalSelection.push(candidate.content);
      selectedContents.add(candidate.content);
    }

    // Simple concatenation for demonstration; real implementation would structure this better
    return finalSelection.join("\n\n---\n\n");
  }
}

export { SemanticContextMergerV2 };