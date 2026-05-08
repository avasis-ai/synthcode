import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface MetricCollector {
    recordLatency(ms: number): void;
    recordCost(tokens: number, currency: string): void;
    recordSuccess(isSuccess: boolean): void;
    getMetrics(): Record<string, any>;
}

export interface PromptCanary {
    id: string;
    template: (input: Message[]) => string;
    weight: number;
    metricCollector: MetricCollector;
}

export interface ExecutionMetrics {
    totalLatencyMs: number;
    totalCost: Record<string, number>;
    successCount: number;
    failureCount: number;
}

export class PromptCanaryExecutor {
    private canaries: PromptCanary[];
    private runtimeMetrics: ExecutionMetrics;

    constructor(canaries: PromptCanary[], runtimeMetrics: ExecutionMetrics) {
        if (!canaries || canaries.length === 0) {
            throw new Error("PromptCanaryExecutor requires at least one canary.");
        }
        this.canaries = canaries;
        this.runtimeMetrics = runtimeMetrics;
    }

    private calculateScore(canary: PromptCanary, metrics: MetricCollector): number {
        const collected = metrics.getMetrics();
        
        // Example scoring function: Prioritize low cost and high success rate.
        // Score = (Weight * SuccessRate) / (1 + CostFactor)
        const successRate = collected.successCount / (collected.successCount + collected.failureCount || 1);
        const costFactor = collected.totalCost / 1000; // Normalize cost
        
        return canary.weight * successRate / (1 + costFactor);
    }

    public async execute(inputMessages: Message[]): Promise<{ optimalCanaryId: string, finalOutput: string }> {
        
        const results: { canaryId: string, score: number, output: string }[] = [];
        
        // Reset metrics for a fresh run
        this.canaries.forEach(c => {
            // Assuming MetricCollector has a reset method or we use fresh instances
            // For simplicity, we assume the provided metricCollector handles aggregation across runs.
        });

        for (const canary of this.canaries) {
            // 1. Generate prompt
            const promptText = canary.template(inputMessages);

            // 2. Simulate API call execution (Replace with actual API call)
            const startTime = Date.now();
            
            // Simulate API call logic
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 50)); 
            
            const latency = Date.now() - startTime;
            const simulatedOutput = `[Output from ${canary.id}]: Processed prompt "${promptText.substring(0, 30)}..."`;
            
            // 3. Simulate metric recording
            canary.metricCollector.recordLatency(latency);
            canary.metricCollector.recordCost(Math.floor(Math.random() * 50) + 10, "USD");
            const isSuccess = Math.random() > 0.1; // 90% success rate simulation
            canary.metricCollector.recordSuccess(isSuccess);

            // 4. Calculate score
            const score = this.calculateScore(canary, canary.metricCollector);

            results.push({
                canaryId: canary.id,
                score: score,
                output: simulatedOutput
            });
        }

        // 5. Select optimal variant
        results.sort((a, b) => b.score - a.score);
        const optimalResult = results[0];

        return {
            optimalCanaryId: optimalResult.canaryId,
            finalOutput: optimalResult.output
        };
    }
}