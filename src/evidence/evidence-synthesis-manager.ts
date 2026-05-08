export type Evidence = {
  source: string;
  claim: string;
  confidence: number;
  justification: string;
};

export type Conclusion = {
  finalClaim: string;
  confidenceScore: number;
  justification: string;
};

export class EvidenceSynthesisManager {
  private evidenceList: Evidence[] = [];

  ingest(evidence: Evidence): void {
    this.evidenceList.push(evidence);
  }

  private calculateWeightedScore(evidence: Evidence): number {
    // Simple weighting model: Confidence * (1 + Source Authority Factor)
    // Source Authority Factor: Assigns higher weight to known reliable sources.
    const authorityMap: Record<string, number> = {
      "Internal Model": 1.5,
      "Verified Database": 2.0,
      "User Input": 1.0,
      "External API": 1.2,
    };
    const authority = authorityMap[evidence.source] || 1.0;
    return evidence.confidence * (1 + authority);
  }

  private resolveConflicts(evidence: Evidence[]): { claim: string; score: number } {
    // Simple conflict resolution: Identify the most frequently asserted claim
    // and calculate a weighted average score based on all evidence supporting it.

    const claimCounts: Record<string, number> = {};
    const weightedScores: Record<string, number> = {};

    for (const e of evidence) {
      const claim = e.claim.trim().toLowerCase();
      claimCounts[claim] = (claimCounts[claim] || 0) + 1;
      const score = this.calculateWeightedScore(e);
      weightedScores[claim] = (weightedScores[claim] || 0) + score;
    }

    let bestClaim = "";
    let maxScore = -1;

    for (const claim in weightedScores) {
      const score = weightedScores[claim];
      if (score > maxScore) {
        maxScore = score;
        bestClaim = claim;
      }
    }

    return { claim: bestClaim, score: maxScore };
  }

  synthesize(): Conclusion {
    if (this.evidenceList.length === 0) {
      return {
        finalClaim: "No evidence provided.",
        confidenceScore: 0.0,
        justification: "Synthesis failed: No evidence was ingested.",
      };
    }

    const { claim: bestClaim, score: totalScore } = this.resolveConflicts(this.evidenceList);

    // Determine the final confidence score (normalized total score)
    const averageConfidence = totalScore / this.evidenceList.length;

    const finalConclusion: Conclusion = {
      finalClaim: bestClaim,
      confidenceScore: parseFloat(averageConfidence.toFixed(2)),
      justification: `Synthesized from ${this.evidenceList.length} pieces of evidence. The claim "${bestClaim}" was identified as the most strongly supported conclusion, achieving a weighted score of ${totalScore.toFixed(2)}.`,
    };

    return finalConclusion;
  }
}