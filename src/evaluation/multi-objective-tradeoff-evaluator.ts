import { type Record } from "node:util";

interface TradeoffMetric {
    cost: number;
    time: number;
    safety: number;
    goal_progress: number;
}

interface Plan {
    id: string;
    metrics: TradeoffMetric;
}

interface EvaluatedPlan {
    plan: Plan;
    score: number;
}

export class MultiObjectiveTradeoffEvaluator {
    /**
     * Evaluates multiple candidate plans by calculating a composite score based on weighted metrics.
     * The score is calculated as the sum of (metric_value * weight).
     *
     * @param plans The list of candidate plans to evaluate.
     * @param weightMap A map defining the priority weight for each metric (e.g., { cost: 0.4, time: 0.3, safety: 0.3 }).
     * @returns A promise resolving to an array of EvaluatedPlan, sorted descending by score.
     */
    public evaluate(plans: Plan[], weightMap: Record<keyof TradeoffMetric, number>): EvaluatedPlan[] {
        if (!plans || plans.length === 0) {
            return [];
        }

        const calculateScore = (plan: Plan): number => {
            let totalScore = 0;
            const metrics = plan.metrics;

            totalScore += metrics.cost * (weightMap.cost ?? 0);
            totalScore += metrics.time * (weightMap.time ?? 0);
            totalScore += metrics.safety * (weightMap.safety ?? 0);
            totalScore += metrics.goal_progress * (weightMap.goal_progress ?? 0);

            return totalScore;
        };

        const scoredPlans: EvaluatedPlan[] = plans.map(plan => ({
            plan: plan,
            score: calculateScore(plan),
        }));

        // Sort by score in descending order (highest score is best)
        scoredPlans.sort((a, b) => b.score - a.score);

        return scoredPlans;
    }
}