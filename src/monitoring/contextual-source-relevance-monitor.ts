import { Message, ContentBlock, TextBlock } from "./types";

export interface IContextSource {
  id: string;
  content: string;
  source_metadata: Record<string, unknown>;
}

export type RelevanceScore = number;

export interface RelevanceReportItem {
  source_id: string;
  score: RelevanceScore;
  is_relevant: boolean;
}

export interface RelevanceDriftReport {
  is_drift_detected: boolean;
  min_score: RelevanceScore;
  threshold: RelevanceScore;
  sources_analyzed: number;
  message: string;
}

class RelevanceScorer {
  private readonly similarityThreshold: number;

  constructor(similarityThreshold: number = 0.5) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Simulates calculating semantic similarity between a source chunk and a target query.
   * In a real system, this would use an embedding model (e.g., cosine similarity).
   * For this implementation, we simulate relevance based on keyword overlap and length.
   * @param sourceContent The content of the context source.
   * @param targetQuery The goal or query the source is being checked against.
   * @returns A score between 0.0 (irrelevant) and 1.0 (perfect match).
   */
  public calculateScore(sourceContent: string, targetQuery: string): RelevanceScore {
    if (!sourceContent || !targetQuery) {
      return 0.0;
    }

    const sourceWords = sourceContent.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const queryWords = targetQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);

    if (sourceWords.length === 0 || queryWords.length === 0) {
      return 0.0;
    }

    const intersection = new Set([...sourceWords].filter(word => queryWords.includes(word)));
    const jaccardIndex = intersection.size / Math.max(sourceWords.length, queryWords.length);

    // Scale the score to simulate a more complex semantic model output
    let score = jaccardIndex * 0.8 + (sourceContent.length / 1000);
    return Math.min(1.0, Math.max(0.0, score));
  }

  public checkRelevance(score: RelevanceScore): boolean {
    return score >= this.similarityThreshold;
  }
}

export class ContextualSourceRelevanceMonitor {
  private readonly scorer: RelevanceScorer;
  private readonly relevanceThreshold: RelevanceScore;

  constructor(relevanceThreshold: RelevanceScore = 0.4) {
    this.relevanceThreshold = relevanceThreshold;
    this.scorer = new RelevanceScorer(relevanceThreshold);
  }

  /**
   * Analyzes a list of context sources against a target query to assess semantic relevance.
   * @param contextSources The list of sources to analyze.
   * @param targetQuery The agent's current goal or query.
   * @returns An array of relevance reports for each source.
   */
  public analyzeSources(contextSources: IContextSource[], targetQuery: string): RelevanceReportItem[] {
    return contextSources.map(source => {
      const score = this.scorer.calculateScore(source.content, targetQuery);
      const isRelevant = this.scorer.checkRelevance(score);
      return {
        source_id: source.id,
        score: score,
        is_relevant: isRelevant,
      };
    });
  }

  /**
   * Checks if the minimum relevance score across all sources falls below the configured threshold,
   * indicating potential semantic relevance drift.
   * @param contextSources The list of sources to analyze.
   * @param targetQuery The agent's current goal or query.
   * @returns A RelevanceDriftReport detailing the findings.
   */
  public checkForDrift(contextSources: IContextSource[], targetQuery: string): RelevanceDriftReport {
    if (contextSources.length === 0) {
      return {
        is_drift_detected: false,
        min_score: 1.0,
        threshold: this.relevanceThreshold,
        sources_analyzed: 0,
        message: "No context sources provided. Cannot detect drift.",
      };
    }

    const scores = contextSources.map(source =>
      this.scorer.calculateScore(source.content, targetQuery)
    );

    const minScore = Math.min(...scores);
    const isDriftDetected = minScore < this.relevanceThreshold;

    const message = isDriftDetected
      ? `WARNING: Semantic relevance drift detected. Minimum score (${minScore.toFixed(2)}) is below the threshold (${this.relevanceThreshold.toFixed(2)}). Consider re-querying or seeking clarification.`
      : `Context sources appear semantically relevant. Minimum score (${minScore.toFixed(2)}) is above the threshold (${this.relevanceThreshold.toFixed(2)}).`;

    return {
      is_drift_detected: isDriftDetected,
      min_score: minScore,
      threshold: this.relevanceThreshold,
      sources_analyzed: contextSources.length,
      message: message,
    };
  }
}