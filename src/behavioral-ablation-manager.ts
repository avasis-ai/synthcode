import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ExecutionMetrics {
    cost: number;
    latencyMs: number;
    success: boolean;
    resourceUsageBytes: number;
    log: string[];
}

type BehavioralPath = (context: {
    initialInput: string;
    history: Message[];
}) => Promise<{
    result: Message;
    metrics: ExecutionMetrics;
}>;

interface AblationContext {
    paths: {
        name: string;
        strategy: BehavioralPath;
    }[];
    initialInput: string;
    history: Message[];
}

export class BehavioralAblationManager {

    private readonly weights: Record<keyof ExecutionMetrics, number>;

    constructor(weights: Record<keyof ExecutionMetrics, number> = {
        cost: 0.4,
        latencyMs: 0.3,
        success: 0.2,
        resourceUsageBytes: 0.1,
    }) {
        this.weights = weights;
    }

    public async runAblation(context: AblationContext): Promise<Record<string, ExecutionMetrics>> {
        const results: Record<string, ExecutionMetrics> = {};

        for (const { name, strategy } of context.paths) {
            try {
                const { result, metrics } = await strategy(context);
                results[name] = metrics;
            } catch (error) {
                console.error(`Ablation failed for path ${name}:`, error);
                results[name] = {
                    cost: Infinity,
                    latencyMs: Infinity,
                    success: false,
                    resourceUsageBytes: Infinity,
                    log: [`Execution failed: ${(error as Error).message}`]
                };
            }
        }
        return results;
    }

    public compareAndRecommend(
        results: Record<string, ExecutionMetrics>
    ): {
        bestPathName: string;
        score: number;
        metrics: ExecutionMetrics;
    } | null {
        const pathScores: {
            name: string;
            score: number;
            metrics: ExecutionMetrics;
        }[] = [];

        for (const [name, metrics] of Object.entries(results)) {
            const nameKey = name as keyof typeof results;
            const weights = this.weights;

            // Normalize metrics for scoring (assuming lower is better for cost/latency/resource)
            // Success is binary (1 if true, 0 if false)
            const score = (
                (metrics.cost / 1000) * weights.cost + // Scale cost down for relative comparison
                (metrics.latencyMs / 1000) * weights.latencyMs +
                (metrics.success ? 0 : 1) * weights.success + // Penalize failure
                (metrics.resourceUsageBytes / 100000) * weights.resourceUsageBytes
            );

            pathScores.push({
                name: name,
                score: score,
                metrics: metrics
            });
        }

        if (pathScores.length === 0) {
            return null;
        }

        pathScores.sort((a, b) => a.score - b.score);

        return {
            bestPathName: pathScores[0].name,
            score: pathScores[0].score,
            metrics: pathScores[0].metrics,
        };
    }
}