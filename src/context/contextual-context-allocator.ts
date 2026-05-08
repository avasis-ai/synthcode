import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./synth-code-types";

export interface Budget {
    maxTokens: number;
    maxTimeMs: number;
    // Add other resource limits if necessary
}

export interface ContextSource {
    id: string;
    // Scoring metrics (0.0 to 1.0)
    relevanceScore: number;
    impactScore: number;
    // Cost calculation
    getCost: (budget: Budget) => {
        tokens: number;
        timeMs: number;
    };
    // Determines if the source is useful/relevant enough to be considered
    isViable(): boolean;
}

export class ContextualContextAllocator {
    private sources: ContextSource[];
    private budget: Budget;

    constructor(sources: ContextSource[], budget: Budget) {
        this.sources = sources;
        this.budget = budget;
    }

    private calculateCombinedScore(source: ContextSource): number {
        // Simple weighted combination: Relevance * Weight_R + Impact * Weight_I
        // Weights can be tuned based on domain knowledge.
        const WEIGHT_RELEVANCE = 0.6;
        const WEIGHT_IMPACT = 0.4;
        return (source.relevanceScore * WEIGHT_RELEVANCE) + (source.impactScore * WEIGHT_IMPACT);
    }

    private calculateEfficiencyRatio(source: ContextSource, cost: { tokens: number; timeMs: number }): number {
        // Ratio = Score / Cost. Lower cost is better.
        // We use a combined score and normalize cost by a small epsilon to prevent division by zero.
        const combinedScore = this.calculateCombinedScore(source);
        const totalCost = cost.tokens + cost.timeMs;
        return combinedScore / (totalCost + 1e-6);
    }

    public allocateContext(): {
        selectedSources: ContextSource[];
        remainingBudget: Budget;
        totalCost: { tokens: number; timeMs: number };
    } {
        let currentBudget = { ...this.budget };
        let selectedSources: ContextSource[] = [];
        let totalCost: { tokens: number; timeMs: number } = { tokens: 0, timeMs: 0 };

        // Filter out sources that are not viable
        let viableSources = this.sources.filter(s => s.isViable());

        // Main greedy selection loop
        while (true) {
            let bestSource: ContextSource | null = null;
            let bestRatio = -1;

            // 1. Find the best source that fits the remaining budget
            for (const source of viableSources) {
                const cost = source.getCost(currentBudget);

                if (cost.tokens <= currentBudget.maxTokens && cost.timeMs <= currentBudget.maxTimeMs) {
                    const ratio = this.calculateEfficiencyRatio(source, cost);

                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestSource = source;
                    }
                }
            }

            // 2. Termination condition
            if (!bestSource) {
                break;
            }

            // 3. Select the best source
            selectedSources.push(bestSource);
            const cost = bestSource.getCost(currentBudget);

            // 4. Update budget and total cost
            currentBudget = {
                maxTokens: currentBudget.maxTokens - cost.tokens,
                maxTimeMs: currentBudget.maxTimeMs - cost.timeMs,
            };
            totalCost = {
                tokens: totalCost.tokens + cost.tokens,
                timeMs: totalCost.timeMs + cost.timeMs,
            };

            // Optional: Remove selected source from viable list to prevent re-selection
            viableSources = viableSources.filter(s => s.id !== bestSource.id);
        }

        return {
            selectedSources,
            remainingBudget: currentBudget,
            totalCost,
        };
    }
}