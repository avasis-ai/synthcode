import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface FailureReport {
    reportId: string;
    timestamp: number;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    observedDeviation: string;
    contextMessages: Message[];
}

export type ImpactScore = Record<string, number>;

interface CauseWeight {
    causeName: string;
    weight: number;
    description: string;
}

export class CausalImpactAnalyzer {
    private readonly defaultWeights: Record<string, number>;

    constructor(defaultWeights: Record<string, number> = {}) {
        this.defaultWeights = defaultWeights;
    }

    private calculateRawImpact(report: FailureReport, potentialCauses: CauseWeight[]): ImpactScore {
        const rawScores: Partial<Record<string, number>> = {};

        for (const cause of potentialCauses) {
            let score = 0;

            // Heuristic scoring based on report severity and cause relevance
            if (cause.causeName === "context_staleness") {
                score += (report.severity === "CRITICAL" ? 0.4 : 0.2);
                if (report.contextMessages.length < 3) {
                    score += 0.3;
                }
            } else if (cause.causeName === "resource_contention") {
                score += (report.observedDeviation.includes("timeout") ? 0.5 : 0.2);
                if (report.severity === "HIGH") {
                    score += 0.3;
                }
            } else if (cause.causeName === "ambiguous_input") {
                score += (report.description.toLowerCase().includes("ambiguous") ? 0.6 : 0.1);
                score += (report.contextMessages.some(m => (m as UserMessage).content.toLowerCase().includes("please clarify")) ? 0.2 : 0);
            } else if (cause.causeName === "model_hallucination") {
                score += (report.observedDeviation.includes("fabricated") ? 0.7 : 0.3);
            }

            // Apply configurable weight
            const effectiveWeight = this.defaultWeights[cause.causeName] || cause.weight;
            rawScores[cause.causeName] = score * effectiveWeight;
        }

        return rawScores as ImpactScore;
    }

    private normalizeScores(rawScores: ImpactScore): Record<string, number> {
        const totalImpact = Object.values(rawScores).reduce((sum, score) => sum + score, 0);

        if (totalImpact === 0) {
            return Object.fromEntries(
                Object.entries(rawScores).map(([key]) => [key, 0])
            );
        }

        const normalized: Record<string, number> = {};
        for (const key in rawScores) {
            if (Object.hasOwnProperty.call(rawScores, key)) {
                normalized[key] = rawScores[key] / totalImpact;
            }
        }
        return normalized;
    }

    public analyze(
        report: FailureReport,
        potentialCauses: CauseWeight[]
    ): {
        impactScores: Record<string, number>;
        prioritizedCauses: { causeName: string; score: number }[];
    } {
        const rawScores = this.calculateRawImpact(report, potentialCauses);
        const normalizedScores = this.normalizeScores(rawScores);

        const prioritizedCauses = Object.entries(normalizedScores)
            .map(([causeName, score]) => ({
                causeName,
                score: parseFloat(score.toFixed(4)),
            }))
            .sort((a, b) => b.score - a.score);

        return {
            impactScores: normalizedScores,
            prioritizedCauses,
        };
    }
}

export const analyzeCausalImpact = (
    report: FailureReport,
    potentialCauses: CauseWeight[],
    defaultWeights: Record<string, number> = {}
) => {
    const analyzer = new CausalImpactAnalyzer(defaultWeights);
    return analyzer.analyze(report, potentialCauses);
};