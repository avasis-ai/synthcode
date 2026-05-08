export type ConfidenceScore = number;

export interface Evidence {
    source: string;
    type: "observation" | "rule" | "calculation" | "source_data";
    confidence: ConfidenceScore;
    payload: Record<string, unknown>;
    timestamp: number;
}

export interface Justification {
    description: string;
    relatedEvidenceIds: string[];
    weight: number;
    timestamp: number;
}

export class ProofContext {
    private evidenceChain: Evidence[];
    private justificationChain: Justification[];

    constructor() {
        this.evidenceChain = [];
        this.justificationChain = [];
    }

    addEvidence(evidence: Evidence): void {
        this.evidenceChain.push(evidence);
    }

    addJustification(justification: Justification): void {
        this.justificationChain.push(justification);
    }

    getEvidenceChain(): ReadonlyArray<Evidence> {
        return Object.freeze([...this.evidenceChain]);
    }

    getJustificationChain(): ReadonlyArray<Justification> {
        return Object.freeze([...this.justificationChain]);
    }

    /**
     * Calculates a quantifiable proof strength score based on accumulated evidence and justifications.
     * The score is a weighted average of evidence confidence and justification weight.
     * @returns {ConfidenceScore} The calculated proof strength (0.0 to 1.0).
     */
    calculateProofStrength(): ConfidenceScore {
        if (this.evidenceChain.length === 0 && this.justificationChain.length === 0) {
            return 0.0;
        }

        let totalEvidenceConfidence = 0;
        for (const evidence of this.evidenceChain) {
            totalEvidenceConfidence += evidence.confidence;
        }
        const avgEvidenceConfidence = this.evidenceChain.length > 0
            ? totalEvidenceConfidence / this.evidenceChain.length
            : 0;

        let totalJustificationWeight = 0;
        for (const justification of this.justificationChain) {
            totalJustificationWeight += justification.weight;
        }
        const avgJustificationWeight = this.justificationChain.length > 0
            ? totalJustificationWeight / this.justificationChain.length
            : 0;

        // Combine evidence and justification strength.
        // Weighting: Evidence (60%) + Justification (40%)
        const combinedScore = (avgEvidenceConfidence * 0.6) + (avgJustificationWeight * 0.4);

        // Ensure score is clamped between 0.0 and 1.0
        return Math.min(1.0, Math.max(0.0, combinedScore));
    }
}

export { ProofContext };