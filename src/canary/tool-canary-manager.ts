import { randomUUID } from "node:crypto";

export type ToolCall = {
    name: string;
    input: Record<string, unknown>;
};

export interface CanaryRule {
    targetVersion: string;
    trafficWeight: number; // 0.0 to 1.0
    fallbackVersion: string;
}

export interface ToolCanaryManagerConfig {
    stableVersion: string;
    canaryRules: CanaryRule[];
}

export interface ToolCanaryMetrics {
    stableCalls: number;
    canaryCalls: number;
    stableSuccessRate: number;
    canarySuccessRate: number;
    // Add other metrics like latency tracking if needed
}

export class ToolCanaryManager {
    private config: ToolCanaryManagerConfig;
    private metrics: ToolCanaryMetrics;

    constructor(config: ToolCanaryManagerConfig) {
        this.config = config;
        this.metrics = {
            stableCalls: 0,
            canaryCalls: 0,
            stableSuccessRate: 0,
            canarySuccessRate: 0,
        };
    }

    private getTargetVersion(contextId: string): string {
        const totalWeight = this.config.canaryRules.reduce((sum, rule) => sum + rule.trafficWeight, 0);
        let cumulativeWeight = 0;
        const randomValue = Math.random();

        if (randomValue < totalWeight) {
            for (const rule of this.config.canaryRules) {
                cumulativeWeight += rule.trafficWeight;
                if (randomValue < cumulativeWeight) {
                    return rule.targetVersion;
                }
            }
        }
        // Fallback to stable if no canary rule matches or total weight is zero
        return this.config.stableVersion;
    }

    public routeToolCall(contextId: string, toolCall: ToolCall): {
        version: string;
        callId: string;
    } {
        const version = this.getTargetVersion(contextId);
        const callId = randomUUID();
        return { version, callId };
    }

    public async executeToolCall(contextId: string, toolCall: ToolCall, executor: (version: string, callId: string, toolCall: ToolCall) => Promise<any>): Promise<any> {
        const { version, callId } = this.routeToolCall(contextId, toolCall);

        try {
            const result = await executor(version, callId, toolCall);
            this.recordSuccess(version);
            return result;
        } catch (error) {
            this.recordFailure(version);
            throw error;
        }
    }

    private recordSuccess(version: string): void {
        if (version === this.config.stableVersion) {
            this.metrics.stableCalls++;
            // Simplified success rate update: assuming success means 1/1 call
            this.metrics.stableSuccessRate = 1.0;
        } else {
            this.metrics.canaryCalls++;
            this.metrics.canarySuccessRate = 1.0;
        }
    }

    private recordFailure(version: string): void {
        if (version === this.config.stableVersion) {
            // In a real system, we'd track failure count vs total calls
            // For simplicity, we just increment the call count and assume failure lowers the rate
            this.metrics.stableCalls++;
            this.metrics.stableSuccessRate = Math.max(0, this.metrics.stableSuccessRate - 0.1);
        } else {
            this.metrics.canaryCalls++;
            this.metrics.canarySuccessRate = Math.max(0, this.metrics.canarySuccessRate - 0.1);
        }
    }

    public getMetrics(): ToolCanaryMetrics {
        return {
            stableCalls: this.metrics.stableCalls,
            canaryCalls: this.metrics.canaryCalls,
            stableSuccessRate: this.metrics.stableSuccessRate,
            canarySuccessRate: this.metrics.canarySuccessRate,
        };
    }

    public shouldPromoteCanary(): boolean {
        // Promotion logic: Canary must be stable and significantly better than stable
        const stableRate = this.metrics.stableSuccessRate;
        const canaryRate = this.metrics.canarySuccessRate;

        if (this.metrics.canaryCalls < 10) {
            return false; // Not enough data
        }

        // Example promotion criteria: Canary rate > Stable rate + 0.1 AND Canary rate > 0.9
        return canaryRate > stableRate + 0.1 && canaryRate > 0.9;
    }
}