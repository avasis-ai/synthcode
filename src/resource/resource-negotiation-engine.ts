import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./synth-code-types";

type ResourceName = "budget" | "time" | "gpu_capacity" | "api_rate_limit";

interface ResourceUsage {
    [key: string]: number;
}

interface ResourceConstraint {
    name: string;
    limit: number;
    usage: ResourceUsage;
    checkFn: (currentUsage: ResourceUsage, stepUsage: ResourceUsage) => boolean;
}

interface PlanStep {
    tool_name: string;
    input: Record<string, unknown>;
    estimated_cost: ResourceUsage;
    priority: number;
}

type Plan = PlanStep[];

interface NegotiationContext {
    initial_resources: ResourceUsage;
    constraints: ResourceConstraint[];
    current_state: Record<string, unknown>;
}

interface ResourceForecast {
    total_usage: ResourceUsage;
    step_breakdown: {
        step_index: number;
        step_cost: ResourceUsage;
        is_feasible: boolean;
        notes: string;
    }[];
}

interface NegotiationResult {
    optimized_plan: Plan;
    resource_forecast: ResourceForecast;
    is_feasible: boolean;
    message: string;
}

export class ResourceNegotiationEngine {
    constructor() {}

    private calculateTotalUsage(plan: Plan): ResourceUsage {
        const total: ResourceUsage = {
            budget: 0,
            time: 0,
            gpu_capacity: 0,
            api_rate_limit: 0,
        };
        for (const step of plan) {
            for (const resource in step.estimated_cost) {
                if (typeof (step.estimated_cost[resource]) === 'number') {
                    total[resource] = (total[resource] || 0) + step.estimated_cost[resource];
                }
            }
        }
        return total;
    }

    private validateStep(
        context: NegotiationContext,
        step: PlanStep,
        currentUsage: ResourceUsage
    ): {
        is_feasible: boolean;
        newUsage: ResourceUsage;
        notes: string;
    } {
        const newUsage: ResourceUsage = { ...currentUsage };
        for (const resource in step.estimated_cost) {
            const cost = step.estimated_cost[resource] as number;
            (newUsage as any)[resource] = (newUsage as any)[resource] + cost;
        }

        let feasible = true;
        let notes = "";

        for (const constraint of context.constraints) {
            if (!constraint.checkFn(newUsage, step.estimated_cost)) {
                feasible = false;
                notes += `Constraint violated: ${constraint.name} exceeded limit of ${constraint.limit}. `;
            }
        }

        return {
            is_feasible: feasible,
            newUsage: newUsage,
            notes: notes.trim(),
        };
    }

    public negotiate(
        plan: Plan,
        context: NegotiationContext
    ): NegotiationResult {
        let currentUsage: ResourceUsage = {
            budget: 0,
            time: 0,
            gpu_capacity: 0,
            api_rate_limit: 0,
        };

        const forecast: ResourceForecast = {
            total_usage: { budget: 0, time: 0, gpu_capacity: 0, api_rate_limit: 0 },
            step_breakdown: [],
        };

        let optimizedPlan: Plan = [];
        let overallFeasibility = true;
        let currentStepUsage: ResourceUsage = {
            budget: 0,
            time: 0,
            gpu_capacity: 0,
            api_rate_limit: 0,
        };

        // 1. Simulate and validate the original plan
        for (let i = 0; i < plan.length; i++) {
            const step = plan[i];
            const validation = this.validateStep(context, step, currentStepUsage);

            forecast.step_breakdown.push({
                step_index: i,
                step_cost: step.estimated_cost,
                is_feasible: validation.is_feasible,
                notes: validation.notes,
            });

            if (!validation.is_feasible) {
                overallFeasibility = false;
            }

            // Only update the usage if the step is deemed acceptable for the forecast,
            // but for optimization, we track the *potential* usage.
            currentStepUsage = validation.newUsage;
        }

        forecast.total_usage = currentStepUsage;

        // 2. Optimization Strategy (Simple: Filter out infeasible steps and re-prioritize)
        const feasibleSteps = plan.filter((_, index) => {
            const validation = this.validateStep(context, plan[index], currentUsage);
            return validation.is_feasible;
        });

        // Sort by priority (highest first)
        feasibleSteps.sort((a, b) => b.priority - a.priority);

        optimizedPlan = feasibleSteps;

        // 3. Final Result Construction
        const finalFeasibility = overallFeasibility && optimizedPlan.length > 0;

        return {
            optimized_plan: optimizedPlan,
            resource_forecast: forecast,
            is_feasible: finalFeasibility,
            message: finalFeasibility
                ? "Plan optimized and deemed feasible based on current resource constraints."
                : "Warning: Original plan contains infeasible steps. An optimized, feasible subset has been generated."
        };
    }
}