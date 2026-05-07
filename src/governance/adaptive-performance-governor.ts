export interface PerformanceMetric {
    latencyMs: number;
    costEstimate: number;
    resourceUtilizationPct: number;
    timestamp: number;
}

export type AdjustmentAction = "CONTINUE" | "THROTTLE" | "FALLBACK" | "WARNING";

export class AdaptivePerformanceGovernor {
    private readonly latencyThresholdMs: number;
    private readonly costThreshold: number;
    private readonly resourceThresholdPct: number;

    constructor(
        latencyThresholdMs: number = 5000,
        costThreshold: number = 0.1,
        resourceThresholdPct: number = 0.8
    ) {
        this.latencyThresholdMs = latencyThresholdMs;
        this.costThreshold = costThreshold;
        this.resourceThresholdPct = resourceThresholdPct;
    }

    private determineAction(metrics: PerformanceMetric): AdjustmentAction {
        let action: AdjustmentAction = "CONTINUE";

        if (metrics.latencyMs > this.latencyThresholdMs) {
            action = "WARNING";
        }

        if (metrics.costEstimate > this.costThreshold) {
            if (action === "WARNING") {
                action = "FALLBACK";
            } else {
                action = "FALLBACK";
            }
        }

        if (metrics.resourceUtilizationPct > this.resourceThresholdPct) {
            if (action === "CONTINUE") {
                action = "THROTTLE";
            } else if (action === "WARNING") {
                action = "THROTTLE";
            }
        }

        return action;
    }

    public checkAndAdjust(metrics: PerformanceMetric): { action: AdjustmentAction; message: string } {
        const action = this.determineAction(metrics);
        let message: string;

        switch (action) {
            case "CONTINUE":
                message = "Performance metrics are within acceptable bounds. Continuing execution.";
                break;
            case "WARNING":
                message = `Warning: High latency detected (${metrics.latencyMs.toFixed(0)}ms). Monitoring closely.`;
                break;
            case "THROTTLE":
                message = `Critical: High resource utilization detected (${metrics.resourceUtilizationPct.toFixed(2)}%). Throttling execution rate to conserve resources.`;
                break;
            case "FALLBACK":
                message = `Critical: Cost estimate exceeded threshold ($${metrics.costEstimate.toFixed(2)}). Initiating fallback strategy to a cheaper tool/method.`;
                break;
        }

        return { action, message };
    }

    public getStatusReport(metrics: PerformanceMetric): Record<string, string> {
        const status: Record<string, string> = {
            latency: `${metrics.latencyMs.toFixed(0)}ms (Threshold: ${this.latencyThresholdMs}ms)`,
            cost: `$${metrics.costEstimate.toFixed(4)} (Threshold: ${this.costThreshold.toFixed(4)})`,
            resource: `${metrics.resourceUtilizationPct.toFixed(2)}% (Threshold: ${this.resourceThresholdPct.toFixed(2)}%)`,
        };
        return status;
    }
}

export { AdaptivePerformanceGovernor };