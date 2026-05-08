import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message,
    LoopEvent
} from "./types";

type HypothesisState = "PENDING" | "EVIDENCE_GATHERING" | "CONFLICT" | "RESOLVED";

export interface Hypothesis {
    id: string;
    claim: string;
    requiredEvidence: string[];
    confidenceWeights: Record<string, number>;
    state: HypothesisState;
    evidenceReceived: Record<string, string[]>;
}

export interface EvidencePayload {
    sourceId: string;
    evidence: string;
    isConflicting?: boolean;
}

export class HypothesisValidationCoordinator {
    private hypotheses: Map<string, Hypothesis>;

    constructor() {
        this.hypotheses = new Map<string, Hypothesis>();
    }

    submitHypothesis(id: string, claim: string, requiredEvidence: string[], confidenceWeights: Record<string, number>): Hypothesis {
        if (this.hypotheses.has(id)) {
            throw new Error(`Hypothesis with ID ${id} already exists.`);
        }

        const newHypothesis: Hypothesis = {
            id: id,
            claim: claim,
            requiredEvidence: requiredEvidence,
            confidenceWeights: confidenceWeights,
            state: "PENDING",
            evidenceReceived: {}
        };

        this.hypotheses.set(id, newHypothesis);
        return newHypothesis;
    }

    getHypothesis(id: string): Hypothesis | undefined {
        return this.hypotheses.get(id);
    }

    private updateHypothesisState(id: string, newState: HypothesisState): Hypothesis {
        const hypothesis = this.getHypothesis(id);
        if (!hypothesis) {
            throw new Error(`Hypothesis ${id} not found.`);
        }
        return { ...hypothesis, state: newState };
    }

    /**
     * Processes incoming evidence, updates the hypothesis state, and checks for conflicts.
     * @param hypothesisId The ID of the hypothesis to validate.
     * @param payload The evidence payload.
     * @returns The updated hypothesis.
     */
    async processEvidence(hypothesisId: string, payload: EvidencePayload): Promise<Hypothesis> {
        let hypothesis = this.getHypothesis(hypothesisId);

        if (!hypothesis) {
            throw new Error(`Cannot process evidence: Hypothesis ${hypothesisId} not found.`);
        }

        if (hypothesis.state === "RESOLVED") {
            console.warn(`Attempted to process evidence for already resolved hypothesis ${hypothesisId}.`);
            return hypothesis;
        }

        // 1. Update evidence
        const evidenceKey = payload.sourceId;
        const currentEvidence = hypothesis.evidenceReceived[evidenceKey] || [];
        hypothesis.evidenceReceived = {
            ...hypothesis.evidenceReceived,
            [evidenceKey]: [...currentEvidence, payload.evidence]
        };

        // 2. Check for conflicts
        let isConflicting = false;
        if (payload.isConflicting && payload.evidence.toLowerCase().includes("contradicts")) {
            isConflicting = true;
        }

        if (isConflicting) {
            hypothesis = this.updateHypothesisState(hypothesisId, "CONFLICT");
        } else if (hypothesis.state === "PENDING") {
            hypothesis = this.updateHypothesisState(hypothesisId, "EVIDENCE_GATHERING");
        }

        // 3. Check if enough evidence is gathered (simplified check)
        const requiredCount = hypothesis.requiredEvidence.length;
        const evidenceCount = Object.keys(hypothesis.evidenceReceived).length;

        if (evidenceCount >= requiredCount) {
            hypothesis = this.updateHypothesisState(hypothesisId, "RESOLVED");
        }

        this.hypotheses.set(hypothesisId, hypothesis);
        return hypothesis;
    }

    /**
     * Calculates the final confidence-weighted verdict based on gathered evidence.
     * This simulates the final synthesis step.
     * @param hypothesisId The ID of the hypothesis.
     * @returns A structured verdict string.
     */
    calculateVerdict(hypothesisId: string): string {
        const hypothesis = this.getHypothesis(hypothesisId);

        if (!hypothesis || hypothesis.state !== "RESOLVED") {
            return `Verdict unavailable. Hypothesis ${hypothesisId} is not yet resolved (Current State: ${hypothesis?.state || 'UNKNOWN'}).`;
        }

        let totalConfidenceScore = 0;
        let verdictDetails = [];

        for (const [source, evidenceList] of Object.entries(hypothesis.evidenceReceived)) {
            const sourceConfidence = hypothesis.confidenceWeights[source] || 1.0;
            const evidenceSummary = evidenceList.join("; ");
            totalConfidenceScore += sourceConfidence;
            verdictDetails.push(`Source ${source}: Confidence ${sourceConfidence.toFixed(2)}. Evidence: ${evidenceSummary.substring(0, 50)}...`);
        }

        const finalVerdict = `VERDICT: HIGH CONFIDENCE. The claim "${hypothesis.claim}" is strongly supported. Total weighted confidence score: ${totalConfidenceScore.toFixed(2)}. Details: ${verdictDetails.join(" | ")}`;

        return finalVerdict;
    }
}

export { HypothesisValidationCoordinator };