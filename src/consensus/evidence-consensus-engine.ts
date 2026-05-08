import { Evidence } from "./types";

interface Evidence {
    sourceId: string;
    fact: string;
    confidence: number;
    weight: number;
}

interface ConflictReport {
    factA: string;
    factB: string;
    sourcesInConflict: string[];
    resolutionRationale: string;
}

interface ConsensusResult {
    consensusFact: string;
    aggregateConfidence: number;
    conflictReport: ConflictReport[];
}

export class EvidenceConsensusEngine {
    private readonly MIN_CONFIDENCE_THRESHOLD: number = 0.1;

    constructor() {}

    private calculateWeightedAverage(evidence: Evidence[]): number {
        let totalWeightedConfidence = 0;
        let totalWeight = 0;

        for (const e of evidence) {
            totalWeightedConfidence += e.confidence * e.weight;
            totalWeight += e.weight;
        }

        return totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;
    }

    private detectConflicts(evidence: Evidence[]): ConflictReport[] {
        const factsMap = new Map<string, Evidence[]>();
        for (const e of evidence) {
            if (!factsMap.has(e.fact)) {
                factsMap.set(e.fact, []);
            }
            factsMap.get(e.fact)!.push(e);
        }

        const distinctFacts = Array.from(factsMap.keys());
        const conflicts: ConflictReport[] = [];

        if (distinctFacts.length <= 1) {
            return [];
        }

        // Simple pairwise conflict detection for demonstration
        for (let i = 0; i < distinctFacts.length; i++) {
            for (let j = i + 1; j < distinctFacts.length; j++) {
                const factA = distinctFacts[i];
                const factB = distinctFacts[j];

                const sourcesA = new Set(evidence.filter(e => e.fact === factA).map(e => e.sourceId));
                const sourcesB = new Set(evidence.filter(e => e.fact === factB).map(e => e.sourceId));
                const conflictingSources = Array.from(new Set([...sourcesA, ...sourcesB]));

                conflicts.push({
                    factA: factA,
                    factB: factB,
                    sourcesInConflict: conflictingSources,
                    resolutionRationale: `Conflict detected between sources regarding "${factA}" and "${factB}". Consensus requires further verification.`
                });
            }
        }
        return conflicts;
    }

    public calculateConsensus(evidence: Evidence[]): ConsensusResult {
        if (evidence.length === 0) {
            return {
                consensusFact: "No evidence provided.",
                aggregateConfidence: 0,
                conflictReport: [],
            };
        }

        const factCounts: Map<string, number> = new Map();
        const factWeightedScores: Map<string, number> = new Map();
        let totalWeightSum = 0;

        for (const e of evidence) {
            factCounts.set(e.fact, (factCounts.get(e.fact) || 0) + 1);
            factWeightedScores.set(e.fact, (factWeightedScores.get(e.fact) || 0) + e.confidence * e.weight);
            totalWeightSum += e.weight;
        }

        let bestFact: string = "";
        let maxScore: number = -1;

        // Determine the consensus fact based on weighted score
        for (const [fact, score] of factWeightedScores.entries()) {
            if (score > maxScore) {
                maxScore = score;
                bestFact = fact;
            }
        }

        const aggregateConfidence = this.calculateWeightedAverage(evidence);
        const conflictReport = this.detectConflicts(evidence);

        return {
            consensusFact: bestFact,
            aggregateConfidence: aggregateConfidence,
            conflictReport: conflictReport,
        };
    }
}