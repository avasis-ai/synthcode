import { Message, ContentBlock, TextBlock } from "./types";

export type Evidence = {
    sourceId: string;
    content: string;
    reliabilityScore: number;
    isConflicting: boolean;
};

export type SourceCredibility = {
    sourceId: string;
    credibilityScore: number;
    notes: string;
};

export interface VerificationReport {
    claim: string;
    confidenceScore: number;
    veracityStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "CONFLICTING";
    evidenceTrail: Evidence[];
    conflictSummary: string;
    supportingSources: SourceCredibility[];
}

class VerificationContext {
    private evidence: Evidence[] = [];
    private sources: SourceCredibility[] = [];
    private conflicts: string[] = [];

    getEvidence(): Evidence[] {
        return [...this.evidence];
    }

    addEvidence(evidence: Evidence) {
        this.evidence.push(evidence);
    }

    addSource(source: SourceCredibility) {
        this.sources.push(source);
    }

    addConflict(conflict: string) {
        this.conflicts.push(conflict);
    }

    getConflicts(): string[] {
        return [...this.conflicts];
    }
}

export class FactVerificationService {
    private context: VerificationContext;

    constructor() {
        this.context = new VerificationContext();
    }

    /**
     * Gathers evidence from a list of potential sources.
     * @param claim The fact to verify.
     * @param sources A list of potential evidence sources (simulated).
     * @returns The updated context.
     */
    public gatherEvidence(claim: string, sources: { id: string; content: string; credibility: number }[]): VerificationContext {
        this.context = new VerificationContext();

        sources.forEach(source => {
            const evidence: Evidence = {
                sourceId: source.id,
                content: source.content,
                reliabilityScore: Math.random() * 0.3 + 0.7, // Simulate varying reliability
                isConflicting: false,
            };
            this.context.addEvidence(evidence);

            const sourceCredibility: SourceCredibility = {
                sourceId: source.id,
                credibilityScore: source.credibility,
                notes: `Evidence gathered from ${source.id}.`,
            };
            this.context.addSource(sourceCredibility);
        });

        return this.context;
    }

    /**
     * Analyzes gathered evidence to identify contradictions and inconsistencies.
     * @returns The updated context.
     */
    public resolveConflicts(): VerificationContext {
        const evidence = this.context.getEvidence();
        const conflicts: string[] = [];

        // Simple conflict detection simulation: check if any evidence mentions "contradictory"
        const conflictingEvidence = evidence.filter(e => e.content.toLowerCase().includes("contradictory"));
        
        if (conflictingEvidence.length > 0) {
            conflicts.push(`Detected ${conflictingEvidence.length} instances of contradictory claims.`);
        }

        // Simulate deeper conflict resolution
        if (evidence.length > 2 && Math.random() > 0.7) {
             conflicts.push("Multiple sources present conflicting data points regarding the timeline.");
        }

        this.context.getConflicts().push(...conflicts);
        return this.context;
    }

    /**
     * Calculates a comprehensive confidence score and determines the veracity status.
     * @returns The final VerificationReport.
     */
    public calculateConfidenceScore(claim: string): VerificationReport {
        const evidence = this.context.getEvidence();
        const sources = this.context.getSources();
        const conflicts = this.context.getConflicts();

        // 1. Calculate average evidence reliability
        const avgReliability = evidence.reduce((sum, e) => sum + e.reliabilityScore, 0) / evidence.length;

        // 2. Calculate average source credibility
        const avgCredibility = sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length;

        // 3. Adjust score based on conflicts
        let confidenceScore = (avgReliability * 0.6 + avgCredibility * 0.4);
        
        if (conflicts.length > 0) {
            confidenceScore -= 0.2 * conflicts.length;
        }

        // Clamp score between 0 and 1
        confidenceScore = Math.max(0, Math.min(1, confidenceScore));

        let veracityStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "CONFLICTING";
        if (confidenceScore >= 0.8) {
            veracityStatus = "VERIFIED";
        } else if (confidenceScore >= 0.5) {
            veracityStatus = "PARTIALLY_VERIFIED";
        } else if (confidenceScore < 0.2) {
            veracityStatus = "UNVERIFIED";
        } else {
            veracityStatus = "CONFLICTING";
        }

        return {
            claim: claim,
            confidenceScore: parseFloat(confidenceScore.toFixed(3)),
            veracityStatus: veracityStatus,
            evidenceTrail: evidence,
            conflictSummary: conflicts.join(" | "),
            supportingSources: sources,
        };
    }
}

export { FactVerificationService };