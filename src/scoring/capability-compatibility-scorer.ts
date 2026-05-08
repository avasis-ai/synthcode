interface Capability {
    name: string;
    description: string;
    // Example attributes used for scoring
    securityLevel: number; // e.g., 1 to 5
    performanceScore: number; // e.g., 0 to 10
    cost: number; // e.g., 0 to 10
    compatibilityScore: number; // A base compatibility metric
}

interface CriterionDetail {
    weight: number;
    min?: number;
    max?: number;
}

interface ScoringCriteria {
    security?: CriterionDetail;
    performance?: CriterionDetail;
    cost?: CriterionDetail;
    compatibility?: CriterionDetail;
}

export class CapabilityCompatibilityScorer {
    score(candidate: Capability, criteria: ScoringCriteria): number {
        let totalScore = 0;

        const calculateWeightedScore = (value: number, criteriaDetail: CriterionDetail, attributeName: keyof Capability): number => {
            let score = 0;
            const weight = criteriaDetail.weight || 0;

            if (attributeName === 'securityLevel') {
                // Example: Security is weighted by how close it is to the minimum required level, up to a cap.
                if (criteriaDetail.min !== undefined) {
                    const diff = Math.max(0, criteriaDetail.min - value);
                    // Penalize based on deficiency, but cap the penalty.
                    score += Math.max(0, 1 - (diff / criteriaDetail.min)) * weight;
                } else {
                    score += weight;
                }
            } else if (attributeName === 'performanceScore') {
                // Example: Performance is weighted by how close it is to the maximum desired level.
                if (criteriaDetail.max !== undefined) {
                    const normalizedValue = Math.min(1, value / criteriaDetail.max);
                    score += normalizedValue * weight;
                } else {
                    score += weight;
                }
            } else if (attributeName === 'cost') {
                // Example: Cost is weighted by how far it is from the maximum allowed cost.
                if (criteriaDetail.max !== undefined) {
                    const normalizedValue = 1 - Math.min(1, value / criteriaDetail.max);
                    score += normalizedValue * weight;
                } else {
                    score += weight;
                }
            } else if (attributeName === 'compatibilityScore') {
                // Simple direct weighting
                score += value * weight;
            }
            return score;
        };

        if (criteria.security) {
            totalScore += calculateWeightedScore(candidate.securityLevel, criteria.security, 'securityLevel');
        }
        if (criteria.performance) {
            totalScore += calculateWeightedScore(candidate.performanceScore, criteria.performance, 'performanceScore');
        }
        if (criteria.cost) {
            totalScore += calculateWeightedScore(candidate.cost, criteria.cost, 'cost');
        }
        if (criteria.compatibility) {
            totalScore += calculateWeightedScore(candidate.compatibilityScore, criteria.compatibility, 'compatibilityScore');
        }

        return totalScore;
    }

    filter(candidates: Capability[], criteria: ScoringCriteria, threshold: number): Capability[] {
        return candidates.filter(candidate => {
            const score = this.score(candidate, criteria);
            return score >= threshold;
        });
    }
}