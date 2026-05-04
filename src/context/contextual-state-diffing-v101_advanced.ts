import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContextualEvent = {
    timestamp: number;
    source: "user" | "assistant" | "tool" | "system";
    impactScore: number;
    description: string;
    relatedMessageId?: string;
};

export interface ContextualStateDiffPayload {
    currentState: Record<string, unknown>;
    previousState: Record<string, unknown>;
    contextEvents: ContextualEvent[];
}

export interface CausalDiffReport {
    diffSummary: string;
    weightedDifferenceScore: number;
    detailedChanges: {
        path: string;
        oldValue: unknown;
        newValue: unknown;
        causalImpact: {
            linkedEvent: ContextualEvent;
            relevanceScore: number;
        } | null;
    }[];
    isSignificantChange: boolean;
}

export class ContextualStateDiffingV101Advanced {
    private readonly WEIGHT_EVENT_IMPACT: number = 0.4;
    private readonly WEIGHT_RECENCY: number = 0.3;
    private readonly WEIGHT_CHANGE_DEPTH: number = 0.3;

    constructor() {}

    private calculateRelevanceScore(event: ContextualEvent, timestamp: number): number {
        const timeDifference = Math.abs(timestamp - event.timestamp);
        // Exponential decay based on time difference (closer is better)
        const recencyFactor = Math.exp(-timeDifference / 10000); // Assuming timestamps are in ms
        return Math.min(1.0, recencyFactor * 1.5); // Scale up slightly
    }

    private calculateWeightedScore(
        currentState: Record<string, unknown>,
        previousState: Record<string, unknown>,
        contextEvents: ContextualEvent[]
    ): number {
        let totalScore = 0;

        if (contextEvents.length === 0) {
            return 0.0;
        }

        // 1. Aggregate Contextual Influence
        const eventScores: { [key: string]: number } = {};
        contextEvents.forEach(event => {
            let score = event.impactScore;
            // Boost score based on recency relative to the current state's conceptual time
            const recency = this.calculateRelevanceScore(event, Date.now());
            score += recency * 0.5; // Add a small boost for recency
            eventScores[event.source] = (eventScores[event.source] || 0) + score;
        });

        const averageEventScore = Object.values(eventScores).reduce((a, b) => a + b, 0) / contextEvents.length;
        totalScore += averageEventScore * this.WEIGHT_EVENT_IMPACT;

        // 2. State Change Contribution (Simple metric: count of differing paths)
        let changeCount = 0;
        const keys = Object.keys(currentState).filter(key => {
            if (!(key in previousState)) return true;
            const current = currentState[key];
            const previous = previousState[key];
            if (typeof current !== typeof previous) return true;
            if (typeof current === 'object' && current !== null && typeof previous === 'object' && previous !== null) {
                // Deep check placeholder - for simplicity, we count any object difference
                return JSON.stringify(current) !== JSON.stringify(previous);
            }
            return current !== previous;
        });
        changeCount = keys.length;
        totalScore += Math.min(1.0, changeCount / 10) * this.WEIGHT_CHANGE_DEPTH; // Normalize change count

        // 3. Temporal Weighting (Placeholder: Assume the most recent event dictates the temporal weight)
        const latestEvent = contextEvents.reduce((prev, current) => (prev.timestamp < current.timestamp ? current : prev), contextEvents[0]);
        totalScore += Math.min(1.0, latestEvent.impactScore / 5.0) * this.WEIGHT_RECENCY;

        return Math.min(1.0, totalScore);
    }

    private analyzeDiff(
        currentState: Record<string, unknown>,
        previousState: Record<string, unknown>,
        contextEvents: ContextualEvent[]
    ): { detailedChanges: { path: string; oldValue: unknown; newValue: unknown; causalImpact: { linkedEvent: ContextualEvent; relevanceScore: number } | null; }[] } {
        const detailedChanges: { path: string; oldValue: unknown; newValue: unknown; causalImpact: { linkedEvent: ContextualEvent; relevanceScore: number } | null; }[] = [];

        const keys = Object.keys(currentState).filter(key => {
            if (!(key in previousState)) return true;
            const current = currentState[key];
            const previous = previousState[key];
            if (typeof current !== typeof previous) return true;
            if (typeof current === 'object' && current !== null && typeof previous === 'object' && previous !== null) {
                return JSON.stringify(current) !== JSON.stringify(previous);
            }
            return current !== previous;
        });

        keys.forEach(key => {
            const newValue = currentState[key];
            const oldValue = previousState[key];
            let bestImpact: { event: ContextualEvent; score: number } = { event: contextEvents[0], score: 0 };
            let maxScore = -1;

            contextEvents.forEach(event => {
                // Simple heuristic: If the key name matches the event source, boost relevance
                let score = event.impactScore;
                if (key.toLowerCase().includes(event.source.toLowerCase())) {
                    score *= 1.5;
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestImpact = { event: event, score: score };
                }
            });

            detailedChanges.push({
                path: key,
                oldValue: oldValue,
                newValue: newValue,
                causalImpact: bestImpact.score > 0 ? {
                    linkedEvent: bestImpact.event,
                    relevanceScore: bestImpact.score / 5.0 // Normalize score for report
                } : null
            });
        });

        return { detailedChanges };
    }

    public generateReport(
        payload: ContextualStateDiffPayload
    ): CausalDiffReport {
        const { currentState, previousState, contextEvents } = payload;

        const { detailedChanges } = this.analyzeDiff(currentState, previousState, contextEvents);

        const weightedScore = this.calculateWeightedScore(currentState, previousState, contextEvents);

        const significant = weightedScore > 0.4 || detailedChanges.length > 3;

        const summary = `State diff calculated. ${detailedChanges.length} fields changed. Weighted score: ${weightedScore.toFixed(3)}.`;

        return {
            diffSummary: summary,
            weightedDifferenceScore: weightedScore,
            detailedChanges: detailedChanges,
            isSignificantChange: significant
        };
    }
}