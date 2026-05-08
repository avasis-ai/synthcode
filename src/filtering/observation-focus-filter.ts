import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Goal = {
    id: string;
    description: string;
    keywords: string[];
};

export type Context = {
    session_id: string;
    history: Message[];
    current_state: Record<string, unknown>;
};

export type Observation = Message | {
    type: "event";
    data: Record<string, unknown>;
};

export interface ObservationFilterRule {
    /**
     * Determines if the rule applies based on the current context and goal.
     */
    canApply(goal: Goal, context: Context): boolean;

    /**
     * Processes a single observation, returning a weight multiplier and a drop flag.
     * @param observation The observation to process.
     * @returns {weight: number, drop: boolean}
     */
    process(observation: Observation): { weight: number; drop: boolean };
}

export class ObservationFocusFilter {
    private rules: ObservationFilterRule[];

    constructor(rules: ObservationFilterRule[]) {
        this.rules = rules;
    }

    /**
     * Applies all relevant rules to an observation stream, calculating a weighted score
     * and filtering out suppressed events.
     * @param goal The current active goal.
     * @param context The current operational context.
     * @param observations The stream of observations to process.
     * @returns {weightedObservations: { observation: Observation, weight: number }[], totalScore: number}
     */
    public applyFilter(
        goal: Goal,
        context: Context,
        observations: Observation[]
    ): { weightedObservations: { observation: Observation, weight: number }[], totalScore: number } {
        
        const activeRules = this.rules.filter(rule => rule.canApply(goal, context));
        
        let totalScore = 0;
        const weightedObservations: { observation: Observation, weight: number }[] = [];

        for (const observation of observations) {
            let maxWeight = 0;
            let shouldDrop = false;

            for (const rule of activeRules) {
                const { weight, drop } = rule.process(observation);
                
                if (drop) {
                    shouldDrop = true;
                    break;
                }

                if (weight > maxWeight) {
                    maxWeight = weight;
                }
            }

            if (!shouldDrop) {
                weightedObservations.push({ 
                    observation: observation, 
                    weight: maxWeight 
                });
                totalScore += maxWeight;
            }
        }

        return { weightedObservations, totalScore };
    }
}