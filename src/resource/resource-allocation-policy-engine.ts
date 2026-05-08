import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

type ResourceName = "cpu" | "memory" | "api_quota" | "time";

export interface ResourceConstraints {
    [key: string]: number;
}

export interface ResourceUsage {
    [key: ResourceName]: number;
}

export interface PlanStep {
    id: string;
    description: string;
    requiredResources: ResourceUsage;
    estimatedDurationMs: number;
    priority: number;
}

export type OptimizationGoal = "minimize_cost" | "maximize_speed" | "balance";

export class ResourceAllocationPolicyEngine {
    private readonly resourceModels: Record<ResourceName, { unit: string; max: number }>;
    private readonly optimizationGoal: OptimizationGoal;

    constructor(
        resourceModels: Record<ResourceName, { unit: string; max: number }>,
        optimizationGoal: OptimizationGoal
    ) {
        this.resourceModels = resourceModels;
        this.optimizationGoal = optimizationGoal;
    }

    private calculateTotalUsage(plan: PlanStep[]): ResourceUsage {
        const usage: ResourceUsage = {
            cpu: 0,
            memory: 0,
            api_quota: 0,
            time: 0,
        };
        for (const step of plan) {
            for (const resource in step.requiredResources) {
                const resourceKey = resource as ResourceName;
                if (usage[resourceKey] !== undefined) {
                    usage[resourceKey] += step.requiredResources[resourceKey];
                }
            }
        }
        return usage;
    }

    evaluatePlan(plan: PlanStep[], constraints: ResourceConstraints): {
        isViable: boolean;
        violations: Record<ResourceName, number>;
        cumulativeUsage: ResourceUsage;
    } {
        const cumulativeUsage = this.calculateTotalUsage(plan);
        const violations: Record<ResourceName, number> = {};
        let isViable = true;

        for (const resource in cumulativeUsage) {
            const resourceKey = resource as ResourceName;
            const usage = cumulativeUsage[resourceKey];
            const constraintLimit = constraints[resourceKey] || Infinity;

            if (usage > constraintLimit) {
                violations[resourceKey] = usage - constraintLimit;
                isViable = false;
            }
        }

        return {
            isViable,
            violations,
            cumulativeUsage,
        };
    }

    private calculateStepScore(step: PlanStep): number {
        const usage = step.requiredResources;
        let score = 0;

        if (this.optimizationGoal === "minimize_cost") {
            score += usage.cpu * 0.5;
            score += usage.api_quota * 1.5;
        } else if (this.optimizationGoal === "maximize_speed") {
            score += step.estimatedDurationMs * 0.01;
        } else {
            score += step.priority * 10;
        }
        return score;
    }

    suggestAdjustments(plan: PlanStep[], constraints: ResourceConstraints): {
        optimizedPlan: PlanStep[];
        suggestions: string[];
    } {
        let currentPlan = [...plan];
        let suggestions: string[] = [];

        // 1. Sorting/Reordering (Greedy approach based on goal)
        if (this.optimizationGoal === "maximize_speed") {
            currentPlan.sort((a, b) => a.estimatedDurationMs - b.estimatedDurationMs);
            suggestions.push("Reordered plan to execute fastest steps first (Speed Optimization).");
        } else if (this.optimizationGoal === "minimize_cost") {
            currentPlan.sort((a, b) => this.calculateStepScore(a) - this.calculateStepScore(b));
            suggestions.push("Reordered plan to execute lowest-cost steps first (Cost Optimization).");
        }

        // 2. Resource Throttling/Pruning (Iterative adjustment)
        let iterationPlan = [...currentPlan];
        let adjustmentsMade = false;

        for (const resource in this.resourceModels) {
            const resourceKey = resource as ResourceName;
            const limit = constraints[resourceKey] || Infinity;
            const totalUsage = this.calculateTotalUsage(iterationPlan)[resourceKey] || 0;

            if (totalUsage > limit) {
                adjustmentsMade = true;
                const excess = totalUsage - limit;
                suggestions.push(`Warning: ${resourceKey} usage exceeds limit by ${excess}.`);

                // Simple throttling heuristic: Reduce resource usage proportionally
                const reductionFactor = limit / totalUsage;
                
                iterationPlan = iterationPlan.map(step => ({
                    ...step,
                    requiredResources: {
                        ...step.requiredResources,
                        [resourceKey]: Math.max(0, step.requiredResources[resourceKey] * reductionFactor)
                    }
                }));
                suggestions.push(`Throttled all steps' ${resourceKey} usage by ${(1 - reductionFactor) * 100}% to meet budget.`);
            }
        }

        return {
            optimizedPlan: iterationPlan,
            suggestions: suggestions.length > 0 ? suggestions : ["Plan appears viable and optimized according to the goal."],
        };
    }
}