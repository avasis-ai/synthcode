import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types";

interface ServiceProvider {
    id: string;
    name: string;
    cost: number;
    slaScore: number;
    schemaCompatibility: number;
    predictedPerformanceScore: number;
    metadata: Record<string, unknown>;
}

interface NegotiationReport {
    providerId: string;
    score: number;
    breakdown: {
        costContribution: number;
        availabilityContribution: number;
        compatibilityContribution: number;
        performanceContribution: number;
    };
    recommendation: string;
}

export class ServiceNegotiationEngine {
    private readonly costWeight: number;
    private readonly slaWeight: number;
    private readonly compatibilityWeight: number;
    private readonly performanceWeight: number;

    constructor(
        costWeight: number = 0.3,
        slaWeight: number = 0.3,
        compatibilityWeight: number = 0.2,
        performanceWeight: number = 0.2
    ) {
        this.costWeight = costWeight;
        this.slaWeight = slaWeight;
        this.compatibilityWeight = compatibilityWeight;
        this.performanceWeight = performanceWeight;
    }

    private calculateScore(
        provider: ServiceProvider
    ): {
        score: number;
        breakdown: {
            costContribution: number;
            availabilityContribution: number;
            compatibilityContribution: number;
            performanceContribution: number;
        };
    } {
        // Normalization assumption: Scores are scaled 0 to 1, except cost (lower is better).
        // We assume cost is normalized such that 0 is best and 1 is worst.
        // For simplicity, we use the raw scores provided, assuming they are already normalized/scaled appropriately.

        const score = (
            (1 - provider.cost) * this.costWeight +
            provider.slaScore * this.slaWeight +
            provider.schemaCompatibility * this.compatibilityWeight +
            provider.predictedPerformanceScore * this.performanceWeight
        );

        return {
            score: score,
            breakdown: {
                costContribution: (1 - provider.cost) * this.costWeight,
                availabilityContribution: provider.slaScore * this.slaWeight,
                compatibilityContribution: provider.schemaCompatibility * this.compatibilityWeight,
                performanceContribution: provider.predictedPerformanceScore * this.performanceWeight,
            }
        };
    }

    public negotiate(
        capability: string,
        providers: ServiceProvider[]
    ): {
        bestProvider: ServiceProvider;
        report: NegotiationReport;
    } {
        if (!providers || providers.length === 0) {
            throw new Error("No service providers provided for negotiation.");
        }

        let bestScore = -1;
        let bestProvider: ServiceProvider | null = null;
        let bestReport: NegotiationReport | null = null;

        const scoredResults = providers.map(provider => {
            const { score, breakdown } = this.calculateScore(provider);
            const report: NegotiationReport = {
                providerId: provider.id,
                score: score,
                breakdown: breakdown,
                recommendation: `Optimal balance for ${capability}.`,
            };
            return { provider, report };
        });

        const bestMatch = scoredResults.reduce((acc, current) => {
            if (current.report.score > acc.score) {
                return { score: current.report.score, provider: current.provider, report: current.report };
            }
            return acc;
        }, { score: -1, provider: null, report: null });

        return {
            bestProvider: bestMatch.provider!,
            report: bestMatch.report!
        };
    }
}