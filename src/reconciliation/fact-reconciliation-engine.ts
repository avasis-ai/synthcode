export interface Fact {
    attribute: string;
    value: any;
    sourceId: string;
    timestamp: number;
    confidence: number;
}

export interface ConflictReport {
    attribute: string;
    conflictingValues: Set<any>;
    details: string;
}

export interface ReconciledFact {
    consensusValue: any;
    aggregatedConfidence: number;
    conflictReport: ConflictReport;
}

export class FactReconciliationEngine {
    constructor() {}

    private calculateConsensus(facts: Fact[]): { consensusValue: any; confidence: number; } {
        if (facts.length === 0) {
            return { consensusValue: null, confidence: 0 };
        }

        const valueCounts = new Map<any, number>();
        const valueConfidenceSums = new Map<any, number>();
        const valueTotalConfidence = new Map<any, number>();

        for (const fact of facts) {
            const currentCount = valueCounts.get(fact.value) || 0;
            valueCounts.set(fact.value, currentCount + 1);

            const currentConfidenceSum = valueConfidenceSums.get(fact.value) || 0;
            valueConfidenceSums.set(fact.value, currentConfidenceSum + fact.confidence);

            const currentTotalConfidence = valueTotalConfidence.get(fact.value) || 0;
            valueTotalConfidence.set(fact.value, currentTotalConfidence + fact.confidence);
        }

        let bestValue: any = facts[0].value;
        let maxScore = -1;

        for (const [value, count] of valueCounts.entries()) {
            const confidenceScore = valueConfidenceSums.get(value)! / count;
            const totalConfidenceScore = valueTotalConfidence.get(value)!;
            
            // Scoring heuristic: Prioritize high count, then high average confidence, then high total confidence.
            const score = (count * 0.3) + (confidenceScore * 0.4) + (totalConfidenceScore * 0.3);

            if (score > maxScore) {
                maxScore = score;
                bestValue = value;
            }
        }

        return { 
            consensusValue: bestValue, 
            confidence: Math.min(1.0, (maxScore / 1.0) * 1.1) // Scale score back to confidence [0, 1]
        };
    }

    private generateConflictReport(facts: Fact[]): ConflictReport {
        const uniqueValues = new Set<any>();
        for (const fact of facts) {
            uniqueValues.add(fact.value);
        }

        const details = uniqueValues.size > 1 
            ? `Conflicting values detected from ${uniqueValues.size} sources.`
            : 'No conflict detected.';

        return {
            attribute: facts[0].attribute,
            conflictingValues: uniqueValues,
            details: details
        };
    }

    reconcile(facts: Fact[]): ReconciledFact[] {
        if (!facts || facts.length === 0) {
            return [];
        }

        const groupedFacts = new Map<string, Fact[]>();
        for (const fact of facts) {
            if (!groupedFacts.has(fact.attribute)) {
                groupedFacts.set(fact.attribute, []);
            }
            groupedFacts.get(fact.attribute)!.push(fact);
        }

        const reconciledResults: ReconciledFact[] = [];

        for (const [attribute, attributeFacts] of groupedFacts.entries()) {
            const { consensusValue, confidence: confidenceScore } = this.calculateConsensus(attributeFacts);
            const conflictReport = this.generateConflictReport(attributeFacts);

            reconciledResults.push({
                consensusValue: consensusValue,
                aggregatedConfidence: confidenceScore,
                conflictReport: conflictReport
            });
        }

        return reconciledResults;
    }
}

export { FactReconciliationEngine };