import { Message, ContentBlock, TextBlock } from "./types";

export type Goal = string;
export type Action = string;
export type Context = string;

export interface SemanticTriple {
  subject: string;
  relation: string;
  object: string;
}

export interface ConflictReport {
  score: number;
  isConflicting: boolean;
  conflictingTriples: SemanticTriple[];
  summary: string;
}

export class SemanticConflictPredictor {
  private readonly semanticDistanceThreshold: number;

  constructor(semanticDistanceThreshold: number = 0.7) {
    this.semanticDistanceThreshold = semanticDistanceThreshold;
  }

  private calculateSemanticDistance(a: string, b: string): number {
    // Simulated complex semantic distance calculation (e.g., using embeddings cosine similarity)
    // For this implementation, we use a simple proxy based on shared keywords and length difference.
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

    let commonWords = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) {
        commonWords++;
      }
    }

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    // Simple heuristic: (Common words / Max length) * 0.5 + (1 - |A|/|B|) * 0.5
    // This simulates a distance score where 1.0 is maximum distance (no overlap) and 0.0 is perfect match.
    const distance = (commonWords / Math.max(1, Math.min(a.length, b.length))) * 0.5 + (1 - Math.abs(a.length - b.length) / Math.max(1, Math.max(a.length, b.length))) * 0.5;
    return Math.min(1.0, Math.max(0.0, distance));
  }

  private detectContradiction(input1: string, input2: string): SemanticTriple[] {
    // Simulated contradiction detection.
    // In a real system, this would involve checking for opposing concepts (e.g., "increase" vs "decrease").
    const contradictions: SemanticTriple[] = [];
    const lower1 = input1.toLowerCase();
    const lower2 = input2.toLowerCase();

    if (lower1.includes("not") && lower2.includes("required")) {
      contradictions.push({
        subject: "Requirement",
        relation: "contradicts",
        object: "Negative assertion detected",
      });
    }
    if (lower1.includes("must") && lower2.includes("optional")) {
      contradictions.push({
        subject: "Constraint",
        relation: "conflicts with",
        object: "Optional status",
      });
    }
    return contradictions;
  }

  /**
   * Analyzes the semantic relationship between a Goal, an Action, and Context to predict conflicts.
   * @param goal The overall objective.
   * @param action The proposed step or action.
   * @param context The retrieved knowledge or current state.
   * @returns A structured ConflictReport.
   */
  public predictConflict(goal: Goal, action: Action, context: Context): ConflictReport {
    // 1. Calculate semantic distances
    const goalActionDistance = this.calculateSemanticDistance(goal, action);
    const goalContextDistance = this.calculateSemanticDistance(goal, context);
    const actionContextDistance = this.calculateSemanticDistance(action, context);

    // 2. Calculate Conflict Score (Higher score means higher conflict risk)
    // We combine distance (low distance = high overlap/low conflict) and contradiction detection.
    // Conflict Score = (1 - Avg Semantic Overlap) + Contradiction Penalty
    const avgOverlap = (goalActionDistance + goalContextDistance + actionContextDistance) / 3.0;
    
    // Since distance is 0 (perfect match) to 1 (no match), we want a score that is high when overlap is low.
    let conflictScore = 1.0 - avgOverlap;

    // 3. Detect explicit contradictions
    const contradictions = [...this.detectContradiction(goal, action), ...this.detectContradiction(goal, context)];

    // 4. Adjust score based on contradictions
    if (contradictions.length > 0) {
      conflictScore += 0.3; // Significant penalty for explicit contradictions
    }

    // 5. Finalize report
    const isConflicting = conflictScore > this.semanticDistanceThreshold;

    return {
      score: Math.min(1.0, conflictScore),
      isConflicting: isConflicting,
      conflictingTriples: contradictions,
      summary: isConflicting
        ? `High semantic conflict predicted. Score ${Math.round(conflictScore * 100)}%. Potential contradiction detected.`
        : `Semantic coherence maintained. Score ${Math.round(conflictScore * 100)}%.`,
    };
  }
}

export { SemanticConflictPredictor };