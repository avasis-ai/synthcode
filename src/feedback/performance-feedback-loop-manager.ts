export type MetricType = "latency" | "cost" | "resource_utilization" | "success_rate";

export interface PerformanceMetric {
    toolId: string;
    metric: MetricType;
    value: number;
    context: string;
}

export type AdjustmentType = "weight_adjustment" | "resource_constraint" | "tool_selection_priority";

export interface SLOProfile {
    [metric: string]: {
        target: number;
        max_acceptable: number;
        min_acceptable: number;
    };
}

export interface PerformanceAdjustment {
    target: string;
    adjustment: AdjustmentType;
    value: number;
    reason: string;
}

export class PerformanceFeedbackLoopManager {
    private sloProfile: SLOProfile;

    constructor(sloProfile: SLOProfile) {
        this.sloProfile = sloProfile;
    }

    private analyzeMetric(metric: PerformanceMetric): PerformanceAdjustment | null {
        const metricKey = metric.metric;
        const slo = this.sloProfile[metricKey];

        if (!slo) {
            return null;
        }

        const deviation = metric.value;

        if (metricKey === "latency") {
            if (deviation > slo.max_acceptable) {
                return {
                    target: metric.toolId,
                    adjustment: "weight_adjustment",
                    value: 0.5,
                    reason: `High latency (${deviation.toFixed(2)}). Reducing weight to encourage faster alternatives.`,
                };
            }
        } else if (metricKey === "cost") {
            if (deviation > slo.max_acceptable) {
                return {
                    target: metric.toolId,
                    adjustment: "resource_constraint",
                    value: 0.8,
                    reason: `High cost (${deviation.toFixed(2)}). Suggesting resource constraint reduction.`,
                };
            }
        } else if (metricKey === "success_rate") {
            if (deviation < slo.min_acceptable) {
                return {
                    target: metric.toolId,
                    adjustment: "tool_selection_priority",
                    value: 0.2,
                    reason: `Low success rate (${deviation.toFixed(2)}). Flagging tool for review or increased priority if necessary.`,
                };
            }
        }

        return null;
    }

    processMetrics(metrics: PerformanceMetric[]): PerformanceAdjustment[] {
        const adjustments: PerformanceAdjustment[] = [];

        for (const metric of metrics) {
            const adjustment = this.analyzeMetric(metric);
            if (adjustment) {
                adjustments.push(adjustment);
            }
        }

        return adjustments;
    }
}

export { PerformanceFeedbackLoopManager, PerformanceMetric, SLOProfile, PerformanceAdjustment };