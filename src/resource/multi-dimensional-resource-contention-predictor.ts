import { PlanStep } from "./plan-step";

export interface ResourceMetrics {
    cpuLoad: number;
    memoryUsage: number;
    networkLatency: number;
    apiQuotaRemaining: number;
    computationalBudget: number;
}

export type PlanAdjustmentSeverity = "low" | "medium" | "high";

export interface PlanAdjustment {
    suggestion: string;
    severity: PlanAdjustmentSeverity;
}

export interface PredictionResult {
    conflictScore: number;
    isContended: boolean;
    adjustment: PlanAdjustment;
}

export class MultiDimensionalResourceContentionPredictor {

    private readonly CONTENTION_THRESHOLD: number;
    private readonly WEIGHTS: {
        cpu: number;
        memory: number;
        network: number;
        quota: number;
        budget: number;
    };

    constructor(contentionThreshold: number = 0.7) {
        this.CONTENTION_THRESHOLD = contentionThreshold;
        this.WEIGHTS = {
            cpu: 0.3,
            memory: 0.25,
            network: 0.2,
            quota: 0.15,
            budget: 0.1,
        };
    }

    private calculateWeightedScore(metrics: ResourceMetrics): number {
        const { cpuLoad, memoryUsage, networkLatency, apiQuotaRemaining, computationalBudget } = metrics;

        // Normalize metrics for scoring (assuming 1.0 is max/worst for load/usage, and low is bad for quota/budget)
        // CPU/Memory: Higher value -> Higher score contribution
        const cpuScore = cpuLoad * this.WEIGHTS.cpu;
        const memoryScore = memoryUsage * this.WEIGHTS.memory;

        // Network Latency: Use a logarithmic or scaled approach to prevent single large spikes from dominating
        // Assuming 100ms is a high contention point.
        const normalizedLatency = Math.min(networkLatency / 100, 1.0);
        const networkScore = normalizedLatency * this.WEIGHTS.network;

        // Quota/Budget: Low remaining value -> High score contribution
        // We invert the remaining quota/budget to represent depletion risk.
        const quotaDepletionRisk = 1.0 - Math.min(apiQuotaRemaining / 1000, 1.0);
        const quotaScore = quotaDepletionRisk * this.WEIGHTS.quota;

        const budgetDepletionRisk = 1.0 - Math.min(computationalBudget / 100, 1.0);
        const budgetScore = budgetDepletionRisk * this.WEIGHTS.budget;

        return cpuScore + memoryScore + networkScore + quotaScore + budgetScore;
    }

    private determineAdjustment(score: number, plan: PlanStep[]): PlanAdjustment {
        if (score > 0.9) {
            return {
                suggestion: "Critical resource saturation detected. Simplify the scope immediately, or switch to an asynchronous, low-resource execution path.",
                severity: "high",
            };
        } else if (score > this.CONTENTION_THRESHOLD) {
            return {
                suggestion: "Resource contention is elevated. Prioritize critical steps and consider batching non-essential operations.",
                severity: "medium",
            };
        } else {
            return {
                suggestion: "Resource utilization is stable. Proceed with the planned steps.",
                severity: "low",
            };
        }
    }

    predictConflict(metrics: ResourceMetrics, plan: PlanStep[]): PredictionResult {
        const conflictScore = this.calculateWeightedScore(metrics);
        const isContended = conflictScore >= this.CONTENTION_THRESHOLD;
        const adjustment = this.determineAdjustment(conflictScore, plan);

        return {
            conflictScore: parseFloat(conflictScore.toFixed(4)),
            isContended: isContended,
            adjustment: adjustment,
        };
    }
}