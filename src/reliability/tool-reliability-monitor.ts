class ToolReliabilityMonitor {
    private metrics: Map<string, ToolMetrics>;
    private readonly DECAY_FACTOR: number;
    private readonly INITIAL_SCORE: number;

    constructor(decayFactor: number = 0.9, initialScore: number = 1.0) {
        this.metrics = new Map<string, ToolMetrics>();
        this.DECAY_FACTOR = decayFactor;
        this.INITIAL_SCORE = initialScore;
    }

    private getMetrics(toolId: string): ToolMetrics {
        if (!this.metrics.has(toolId)) {
            this.metrics.set(toolId, {
                successCount: 0,
                failureCount: 0,
                totalLatencyMs: 0,
                lastCallTime: 0,
                reliabilityScore: this.INITIAL_SCORE,
            });
        }
        return this.metrics.get(toolId)!;
    }

    public updateScore(toolId: string, isSuccess: boolean, latencyMs: number): void {
        const metrics = this.getMetrics(toolId);

        // 1. Apply decay to the existing score
        metrics.reliabilityScore *= this.DECAY_FACTOR;

        // 2. Update counts and latency
        if (isSuccess) {
            metrics.successCount += 1;
            metrics.totalLatencyMs += latencyMs;
        } else {
            metrics.failureCount += 1;
        }
        metrics.lastCallTime = Date.now();

        // 3. Recalculate the score based on performance
        let newScore = this.INITIAL_SCORE;

        // Weighting factors:
        // Success ratio (higher is better)
        const totalCalls = metrics.successCount + metrics.failureCount;
        const successRatio = totalCalls > 0 ? metrics.successCount / totalCalls : 1.0;

        // Failure penalty (exponential decay based on failures)
        const failurePenalty = Math.pow(0.9, metrics.failureCount);

        // Latency penalty (normalized average latency)
        const avgLatency = totalCalls > 0 ? metrics.totalLatencyMs / totalCalls : 1;
        // Use a sigmoid or inverse function to penalize high latency, capping the penalty
        const latencyPenalty = Math.min(1.0, 1.0 / (1.0 + avgLatency / 1000));

        // Combined score calculation
        newScore = (
            (this.INITIAL_SCORE * 0.4) * successRatio +
            (this.INITIAL_SCORE * 0.4) * failurePenalty +
            (this.INITIAL_SCORE * 0.2) * latencyPenalty
        );

        // Ensure the score remains within [0.0, 1.0]
        metrics.reliabilityScore = Math.max(0.0, Math.min(1.0, newScore));
    }

    public getReliabilityScore(toolId: string): number {
        const metrics = this.metrics.get(toolId);
        if (!metrics) {
            return 0.0;
        }
        return metrics.reliabilityScore;
    }
}

export { ToolReliabilityMonitor };