import {
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types.js";

export interface GoalState {
    goalId: string;
    currentPhase: "planning" | "executing" | "reviewing" | "idle";
    driftScore: number;
    requiredContextTypes: string[];
}

export interface ContextSource {
    sourceId: string;
    sourceType: "memory" | "history" | "external" | "goal_state";
    payload: any;
    metadata: Record<string, any>;
}

export interface SourceWeightingRule {
    sourceType: ContextSource["sourceType"];
    condition: (state: GoalState, source: ContextSource) => boolean;
    weightBoost: number;
}

export interface PrioritizedContext {
    sourceId: string;
    sourceType: ContextSource["sourceType"];
    weightedPayload: any;
    finalWeight: number;
}

export class ContextualSourcePrioritizer {
    private sources: ContextSource[];
    private rules: SourceWeightingRule[];

    constructor(sources: ContextSource[], rules: SourceWeightingRule[]) {
        this.sources = sources;
        this.rules = rules;
    }

    private calculateWeight(source: ContextSource, state: GoalState): number {
        let baseWeight = 1.0;
        let totalBoost = 0;

        for (const rule of this.rules) {
            if (rule.sourceType === source.sourceType) {
                if (rule.condition(state, source)) {
                    totalBoost += rule.weightBoost;
                }
            }
        }

        return baseWeight + totalBoost;
    }

    public prioritize(sources: ContextSource[], state: GoalState): PrioritizedContext[] {
        const sourcesToProcess = sources.length > 0 ? sources : this.sources;
        const prioritizedResults: PrioritizedContext[] = [];

        for (const source of sourcesToProcess) {
            const finalWeight = this.calculateWeight(source, state);

            const result: PrioritizedContext = {
                sourceId: source.sourceId,
                sourceType: source.sourceType,
                weightedPayload: source.payload,
                finalWeight: finalWeight,
            };
            prioritizedResults.push(result);
        }

        // Sort by weight descending
        return prioritizedResults.sort((a, b) => b.finalWeight - a.finalWeight);
    }
}