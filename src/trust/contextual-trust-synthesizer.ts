export type SourceAuthority = number;
export type Timestamp = number;

export interface SourceMetadata {
  sourceId: string;
  authority: SourceAuthority;
  timestamp: Timestamp;
  content: string;
}

export interface TrustReport {
  finalScore: number;
  isTrustworthy: boolean;
  supportingEvidence: {
    sourceId: string;
    weightContribution: number;
    reason: string;
  }[];
  conflictDetails: string[];
}

export class ContextualTrustSynthesizer {
  private readonly DECAY_RATE: number = 0.0001;
  private readonly AUTHORITY_WEIGHT: number = 0.4;
  private readonly RECENCY_WEIGHT: number = 0.3;
  private readonly CONSENSUS_WEIGHT: number = 0.3;

  constructor() {}

  private calculateRecencyScore(timestamp: Timestamp): number {
    const now = Date.now();
    const age = now - timestamp;
    // Exponential decay: closer to 1 for recent, closer to 0 for old
    return Math.exp(-this.DECAY_RATE * age);
  }

  private calculateSourceWeight(metadata: SourceMetadata): number {
    const recencyScore = this.calculateRecencyScore(metadata.timestamp);
    // Weight = Authority * Recency * (1 + log(sourceId length))
    const sourceFactor = 1 + Math.log(metadata.sourceId.length + 1);
    return metadata.authority * recencyScore * sourceFactor;
  }

  private detectConflicts(sources: SourceMetadata[], claim: string): string[] {
    const conflicts: string[] = [];
    const claimsArray = sources.map(s => s.content.toLowerCase());

    // Simple conflict detection: check if sources contradict the main claim
    for (let i = 0; i < sources.length; i++) {
      const sourceContent = sources[i].content.toLowerCase();
      const sourceId = sources[i].sourceId;

      // Example conflict rule: If source claims X but the main claim is Y, and they are different.
      if (sourceContent.includes("not true") && !claim.toLowerCase().includes("not true")) {
        conflicts.push(`Source ${sourceId} explicitly contradicts the core claim.`);
      }
    }
    return conflicts;
  }

  public synthesize(sources: SourceMetadata[], claim: string): TrustReport {
    if (!sources || sources.length === 0) {
      return {
        finalScore: 0,
        isTrustworthy: false,
        supportingEvidence: [],
        conflictDetails: ["No sources provided to synthesize trust."],
      };
    }

    let totalWeightedScore = 0;
    const supportingEvidence: {
      sourceId: string;
      weightContribution: number;
      reason: string;
    }[] = [];

    // 1. Calculate individual source weights
    const sourceWeights = sources.map(s => ({
      metadata: s,
      weight: this.calculateSourceWeight(s),
    }));

    // 2. Calculate Consensus Score (Average of top N sources)
    const topSources = sourceWeights.sort((a, b) => b.weight - a.weight).slice(0, Math.min(3, sources.length));
    const consensusScore = topSources.reduce((sum, item) => sum + item.weight, 0) / Math.max(1, topSources.length);

    // 3. Calculate Final Weighted Score
    // Final Score = (Avg Source Weight * Authority) * Recency * Consensus
    const averageSourceWeight = sourceWeights.reduce((sum, item) => sum + item.weight, 0) / sources.length;

    const finalScore = (
      averageSourceWeight * this.AUTHORITY_WEIGHT +
      consensusScore * this.RECENCY_WEIGHT * 10 + // Boost consensus impact
      (sources.length / 10) * this.CONSENSUS_WEIGHT // Simple count factor
    );

    // 4. Generate Evidence and Conflicts
    for (const { metadata, weight } of sourceWeights) {
      supportingEvidence.push({
        sourceId: metadata.sourceId,
        weightContribution: weight,
        reason: `Source authority (${metadata.authority}) combined with recency and content relevance.`,
      });
      totalWeightedScore += weight;
    }

    const conflictDetails = this.detectConflicts(sources, claim);

    // 5. Determine Trustworthiness
    const isTrustworthy = finalScore > 0.5 && conflictDetails.length === 0;

    return {
      finalScore: parseFloat(finalScore.toFixed(4)),
      isTrustworthy: isTrustworthy,
      supportingEvidence: supportingEvidence,
      conflictDetails: conflictDetails,
    };
  }
}

export { ContextualTrustSynthesizer };