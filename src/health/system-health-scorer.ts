export interface MetricInput {
    value: number;
    type: "latency" | "cost" | "resource" | "drift";
    weight: number;
    decayRate: number;
}

export class SystemHealthScorer {
    calculateScore(metrics: MetricInput[]): number {
        if (!metrics || metrics.length === 0) {
            return 0.0;
        }

        let totalWeightedScore = 0.0;

        for (const metric of metrics) {
            // 1. Normalization/Scoring: Assuming 'value' is already a normalized score (0 to 1, 1 being perfect).
            let normalizedValue = metric.value;

            // 2. Decay Application: Apply exponential decay based on the decay rate.
            // Decay Factor = e^(-decayRate)
            const decayFactor = Math.exp(-metric.decayRate);

            // 3. Weighted Contribution: Contribution = NormalizedValue * Weight * DecayFactor
            const contribution = normalizedValue * metric.weight * decayFactor;

            totalWeightedScore += contribution;
        }

        // The final score is the sum of all weighted and decayed contributions.
        return totalWeightedScore;
    }
}

export { SystemHealthScorer };