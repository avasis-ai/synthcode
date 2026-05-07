import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface PromptVersion {
    id: string;
    template: string;
    weight: number;
}

interface Metrics {
    totalRequests: number;
    successfulRequests: number;
    totalLatencyMs: number;
    averageLatencyMs: number;
    totalCost: number;
    successRate: number;
}

export class PromptCanaryManager {
    private versions: Map<string, PromptVersion>;
    private metrics: Map<string, Metrics>;

    constructor(initialVersions: PromptVersion[]) {
        this.versions = new Map();
        this.metrics = new Map();

        for (const version of initialVersions) {
            this.versions.set(version.id, version);
            this.metrics.set(version.id, {
                totalRequests: 0,
                successfulRequests: 0,
                totalLatencyMs: 0,
                averageLatencyMs: 0,
                totalCost: 0,
                successRate: 0,
            });
        }
    }

    private getVersion(id: string): PromptVersion | undefined {
        return this.versions.get(id);
    }

    private getMetrics(id: string): Metrics {
        return this.metrics.get(id)!;
    }

    /**
     * Selects a prompt version using weighted random routing.
     * @param context Optional context for advanced routing (e.g., user segment).
     * @returns The selected PromptVersion.
     */
    public routePrompt(context?: Record<string, unknown>): PromptVersion {
        if (this.versions.size === 0) {
            throw new Error("No prompt versions configured.");
        }

        const totalWeight = Array.from(this.versions.values()).reduce(
            (sum, v) => sum + v.weight,
            0
        );

        if (totalWeight === 0) {
            throw new Error("Total weight of all prompt versions is zero.");
        }

        let random = Math.random() * totalWeight;

        for (const version of this.versions.values()) {
            if (random < version.weight) {
                return version;
            }
            random -= version.weight;
        }

        // Fallback (should not happen if weights are positive)
        return Array.from(this.versions.values())[0];
    }

    /**
     * Records performance metrics for a specific prompt version.
     * @param versionId The ID of the version used.
     * @param latencyMs The observed latency in milliseconds.
     * @param cost The observed cost of the request.
     * @param success Whether the request was successful.
     */
    public recordMetrics(
        versionId: string,
        latencyMs: number,
        cost: number,
        success: boolean
    ): void {
        const metrics = this.getMetrics(versionId);

        metrics.totalRequests += 1;
        metrics.totalLatencyMs += latencyMs;
        metrics.totalCost += cost;

        if (success) {
            metrics.successfulRequests += 1;
        }

        metrics.averageLatencyMs = metrics.totalLatencyMs / metrics.totalRequests;
        metrics.successRate = metrics.successfulRequests / metrics.totalRequests;
    }

    /**
     * Determines the optimal prompt version based on weighted scoring.
     * Scoring prioritizes high success rate, low average latency, and low cost.
     * @returns The ID of the best performing version.
     */
    public selectBestVersion(): string {
        let bestVersionId: string | null = null;
        let highestScore = -Infinity;

        for (const [id, metrics] of this.metrics.entries()) {
            if (metrics.totalRequests === 0) continue;

            // Scoring function: (Success Rate * 5) - (Avg Latency / 100) - (Cost * 10)
            // Weights are arbitrary and designed to prioritize reliability first.
            const score = (metrics.successRate * 5) - (metrics.averageLatencyMs / 100) - (metrics.totalCost * 10);

            if (score > highestScore) {
                highestScore = score;
                bestVersionId = id;
            }
        }

        return bestVersionId || Array.from(this.versions.keys())[0];
    }
}