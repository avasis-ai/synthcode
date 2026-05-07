import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface StateDelta {
    key: string;
    delta: any;
}

export interface PredictionResult {
    predictedState: Record<string, any>;
    confidenceScore: number;
    deltas: StateDelta[];
}

export interface IStatePredictionRule {
    name: string;
    /**
     * Predicts the impact of a plan on the external state.
     * @param currentState The current known state.
     * @param plan The proposed action or plan (e.g., a sequence of messages/tools).
     * @returns A prediction result including the predicted state and confidence.
     */
    predict(currentState: Record<string, any>, plan: Message[]): {
        predictedState: Record<string, any>;
        confidenceScore: number;
        deltas: StateDelta[];
    };
}

export class ExternalStatePredictor {
    private rules: IStatePredictionRule[];

    constructor() {
        this.rules = [];
    }

    addRule(rule: IStatePredictionRule): void {
        this.rules.push(rule);
    }

    /**
     * Runs the plan through all registered rules, aggregates the predicted state changes,
     * and calculates an overall risk/confidence report.
     * @param initialState The current known state of the system.
     * @param plan The sequence of actions/messages to predict the impact of.
     * @returns An aggregated prediction result.
     */
    predict(initialState: Record<string, any>, plan: Message[]): PredictionResult {
        let aggregatedState: Record<string, any> = { ...initialState };
        let totalConfidence = 0;
        let totalDeltas: StateDelta[] = [];

        for (const rule of this.rules) {
            const prediction = rule.predict(aggregatedState, plan);

            // Aggregate state changes
            for (const delta of prediction.deltas) {
                aggregatedState[delta.key] = delta.delta;
            }

            // Aggregate confidence (simple average/sum for demonstration)
            totalConfidence += prediction.confidenceScore;
            totalDeltas.push(...prediction.deltas);
        }

        const averageConfidence = this.rules.length > 0 ? totalConfidence / this.rules.length : 0;

        return {
            predictedState: aggregatedState,
            confidenceScore: averageConfidence,
            deltas: totalDeltas,
        };
    }
}