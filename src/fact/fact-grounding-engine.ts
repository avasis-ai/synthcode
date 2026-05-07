export type Fact = {
    subject: string;
    predicate: string;
    object: string;
};

export interface VerificationResult {
    isValid: boolean;
    confidenceScore: number;
    sourceMetadata: Record<string, unknown>;
    evidence: string;
}

export interface FactSource {
    name: string;
    verify(fact: Fact): Promise<VerificationResult>;
}

export interface GroundingReport {
    overallConfidence: number;
    isFactGroundable: boolean;
    sourceBreakdown: VerificationResult[];
    summary: string;
}

export class FactGroundingEngine {
    private sources: FactSource[];
    private weights: Record<string, number>;

    constructor(sources: FactSource[], weights: Record<string, number> = {}) {
        this.sources = sources;
        this.weights = weights;
    }

    private calculateWeightedAverage(results: VerificationResult[]): number {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const sourceName = this.sources[i].name;
            
            // Use configured weight or default to 1.0
            const weight = this.weights[sourceName] !== undefined ? this.weights[sourceName] : 1.0;

            // Weight the confidence score
            totalWeightedScore += result.confidenceScore * weight;
            totalWeight += weight;
        }

        if (totalWeight === 0) {
            return 0.0;
        }

        return totalWeightedScore / totalWeight;
    }

    public async verifyFact(fact: Fact): Promise<GroundingReport> {
        const verificationPromises = this.sources.map(source => source.verify(fact));
        
        const sourceBreakdown = await Promise.all(verificationPromises);

        const overallConfidence = this.calculateWeightedAverage(sourceBreakdown);
        
        const isFactGroundable = overallConfidence >= 0.7;

        let summary = `The fact "${fact.subject} ${fact.predicate} ${fact.object}" was verified.`;
        if (isFactGroundable) {
            summary += ` Overall confidence: ${overallConfidence.toFixed(2)}. The claim is strongly supported by the sources.`;
        } else {
            summary += ` Overall confidence: ${overallConfidence.toFixed(2)}. Further investigation or more reliable sources are needed.`;
        }

        return {
            overallConfidence: overallConfidence,
            isFactGroundable: isFactGroundable,
            sourceBreakdown: sourceBreakdown,
            summary: summary
        };
    }
}