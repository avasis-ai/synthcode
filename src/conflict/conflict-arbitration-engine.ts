import { ConflictInput, ConflictResolutionResult } from "./types";

type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ConflictType = "RESOURCE" | "GOAL" | "POLICY" | "SEMANTIC" | "OTHER";

interface ConflictInput {
    sourceId: string;
    sourceName: string;
    conflictType: ConflictType;
    severity: ConflictSeverity;
    description: string;
    proposedResolution: string;
    weight: number; // Source reliability weight (e.g., 0.5 to 1.0)
}

class ConflictArbitrationEngine {
    private severityWeights: Record<ConflictSeverity, number> = {
        "LOW": 1,
        "MEDIUM": 3,
        "HIGH": 7,
        "CRITICAL": 10
    };

    /**
     * Resolves a list of conflicting inputs by applying weighted scoring.
     * @param inputs Array of conflicting inputs.
     * @returns A ConflictResolutionResult containing the final decision and rationale.
     */
    public resolve(inputs: ConflictInput[]): ConflictResolutionResult {
        if (!inputs || inputs.length === 0) {
            return {
                finalDecision: "No conflicts detected.",
                rationale: "No inputs provided for arbitration.",
                correctiveActions: [],
                score: 0
            };
        }

        let totalScore = 0;
        const scoredConflicts: { input: ConflictInput, score: number }[] = [];

        for (const input of inputs) {
            const severityWeight = this.severityWeights[input.severity] || 1;
            // Weighted Score = Severity Weight * Source Weight
            const score = severityWeight * input.weight;
            totalScore += score;
            scoredConflicts.push({ input, score });
        }

        // Sort conflicts by score descending to determine priority
        scoredConflicts.sort((a, b) => b.score - a.score);

        const highestPriorityConflict = scoredConflicts[0];
        const topConflicts = scoredConflicts.slice(0, Math.min(3, inputs.length));

        let finalDecision: string;
        let rationale: string;
        const correctiveActions: string[] = [];

        if (totalScore < 10) {
            finalDecision = "Minor conflict detected. Proceed with caution.";
            rationale = `The overall conflict score (${totalScore.toFixed(2)}) is low. The primary conflict (${highestPriorityConflict.input.conflictType}) suggests a minor disagreement.`;
            correctiveActions.push("Review documentation for best practice guidelines.");
        } else if (totalScore < 30) {
            finalDecision = "Moderate conflict detected. Requires targeted adjustment.";
            rationale = `The conflict score (${totalScore.toFixed(2)}) is moderate. The highest priority conflict is ${highestPriorityConflict.input.conflictType} from ${highestPriorityConflict.input.sourceName}.`;
            correctiveActions.push(`Adjust ${highestPriorityConflict.input.conflictType} based on the proposed resolution: "${highestPriorityConflict.input.proposedResolution}".`);
        } else {
            finalDecision = "Critical conflict detected. Immediate manual intervention required.";
            rationale = `The conflict score (${totalScore.toFixed(2)}) is high, indicating severe disagreement across multiple sources. The top conflicts are: ${topConflicts.map(c => `${c.input.conflictType} (${c.input.sourceName})`).join(', ')}.`;
            correctiveActions.push("Halt execution flow.");
            correctiveActions.push("Engage human expert for resolution.");
        }

        return {
            finalDecision: finalDecision,
            rationale: rationale,
            correctiveActions: correctiveActions,
            score: totalScore
        };
    }
}

export { ConflictArbitrationEngine };