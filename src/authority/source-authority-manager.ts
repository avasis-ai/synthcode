export interface SourceMetadata {
    sourceId: string;
    reliabilityScore: number;
    lastAccessedTimestamp: number;
    conflictCount: number;
    corroborationCount: number;
}

export interface AuthorityScore {
    score: number;
    details: {
        reliabilityWeight: number;
        recencyWeight: number;
        corroborationWeight: number;
        conflictPenalty: number;
    };
}

export class SourceAuthorityManager {
    private readonly WEIGHT_RELIABILITY: number;
    private readonly WEIGHT_RECENCY: number;
    private readonly WEIGHT_CORROBORATION: number;
    private readonly RECENCY_DECAY_FACTOR: number;
    private readonly CONFLICT_PENALTY_FACTOR: number;

    constructor(
        reliabilityWeight: number = 0.4,
        recencyWeight: number = 0.3,
        corroborationWeight: number = 0.3,
        recencyDecayFactor: number = 0.001,
        conflictPenaltyFactor: number = 0.1
    ) {
        this.WEIGHT_RELIABILITY = reliabilityWeight;
        this.WEIGHT_RECENCY = recencyWeight;
        this.WEIGHT_CORROBORATION = corroborationWeight;
        this.RECENCY_DECAY_FACTOR = recencyDecayFactor;
        this.CONFLICT_PENALTY_FACTOR = conflictPenaltyFactor;
    }

    calculateAuthorityScore(metadata: SourceMetadata): AuthorityScore {
        const now = Date.now();
        const ageMs = now - metadata.lastAccessedTimestamp;

        // 1. Reliability Contribution (Directly weighted)
        const reliabilityContribution = metadata.reliabilityScore * this.WEIGHT_RELIABILITY;

        // 2. Recency Contribution (Decays over time)
        // Score decreases as age increases. We normalize age decay.
        const recencyDecay = Math.exp(-this.RECENCY_DECAY_FACTOR * ageMs);
        const recencyContribution = recencyDecay * this.WEIGHT_RECENCY;

        // 3. Corroboration Contribution (Directly weighted)
        const corroborationContribution = metadata.corroborationCount * this.WEIGHT_CORROBORATION;

        // 4. Conflict Penalty (Penalizes high conflict count)
        const conflictPenalty = metadata.conflictCount * this.CONFLICT_PENALTY_FACTOR;

        // Total Score Calculation
        const totalScore = reliabilityContribution + recencyContribution + corroborationContribution - conflictPenalty;

        return {
            score: Math.max(0, totalScore),
            details: {
                reliabilityWeight: reliabilityContribution,
                recencyWeight: recencyContribution,
                corroborationWeight: corroborationContribution,
                conflictPenalty: conflictPenalty,
            }
        };
    }

    /**
     * Updates metadata based on new interaction and recalculates the score.
     * @param currentMetadata The existing metadata.
     * @param newCorroborationCount Incremental count of corroborating sources found.
     * @param newConflictCount Incremental count of conflicts found.
     * @returns The updated metadata and the new authority score.
     */
    updateAndScore(
        currentMetadata: SourceMetadata,
        newCorroborationCount: number,
        newConflictCount: number
    ): { metadata: SourceMetadata; score: AuthorityScore } {
        const updatedMetadata: SourceMetadata = {
            sourceId: currentMetadata.sourceId,
            reliabilityScore: currentMetadata.reliabilityScore,
            lastAccessedTimestamp: Date.now(),
            conflictCount: currentMetadata.conflictCount + newConflictCount,
            corroborationCount: currentMetadata.corroborationCount + newCorroborationCount,
        };

        const score = this.calculateAuthorityScore(updatedMetadata);

        return {
            metadata: updatedMetadata,
            score: score
        };
    }
}

export { SourceAuthorityManager };