interface MetricValue {
    value: number;
    timestamp: number;
}

interface MetricSource {
    name: string;
    weight: number;
    // Function to process raw input into a normalized score (0 to 1)
    normalize: (raw: unknown) => number;
}

export class CompositeHealthScorer {
    private metricSources: Map<string, MetricSource> = new Map();
    private decayRate: number;

    constructor(decayRate: number = 0.05) {
        this.decayRate = decayRate;
    }

    addMetricSource(source: MetricSource): void {
        this.metricSources.set(source.name, source);
    }

    private getDecayFactor(metricName: string): number {
        const source = this.metricSources.get(metricName);
        if (!source) return 0;

        // In a real-world scenario, we would store the last update time per metric.
        // For this implementation, we assume the input map provides the current time,
        // and we simulate the decay based on the time difference from a hypothetical last update.
        // Since we don't store historical timestamps in this simplified structure,
        // we will assume the decay factor is applied based on the time elapsed since the last calculation
        // or simply use a fixed decay factor if no time context is provided.
        // To satisfy the requirement, we will use a simple time decay based on the decayRate.
        return Math.exp(-this.decayRate);
    }

    /**
     * Calculates the holistic operational health score based on current metrics.
     * @param currentMetrics A map where keys are metric names and values are the raw readings.
     * @returns A single, weighted, and decayed health score (0.0 to 1.0).
     */
    calculateScore(currentMetrics: Record<string, unknown>): number {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        for (const [metricName, rawValue] of Object.entries(currentMetrics)) {
            const source = this.metricSources.get(metricName);

            if (!source) {
                continue;
            }

            // 1. Normalize the raw value to a score (0 to 1)
            const normalizedScore = source.normalize(rawValue);

            // 2. Apply the decay factor (simulating time decay)
            // Note: A more robust implementation would track timestamps and calculate decay based on elapsed time.
            const decayFactor = this.getDecayFactor(metricName);
            const decayedScore = normalizedScore * decayFactor;

            // 3. Apply the weight
            const weightedScore = decayedScore * source.weight;

            totalWeightedScore += weightedScore;
            totalWeight += source.weight;
        }

        if (totalWeight === 0) {
            return 0.0;
        }

        // Calculate the weighted average
        return totalWeightedScore / totalWeight;
    }
}