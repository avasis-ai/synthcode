import { ResourceContext, SchedulableStep, ExecutionPlan } from "./types";

export class ResourceAwareTaskScheduler {
    private steps: SchedulableStep[];
    private context: ResourceContext;

    constructor(steps: SchedulableStep[], context: ResourceContext) {
        this.steps = steps;
        this.context = context;
    }

    private calculateRemainingResources(step: SchedulableStep, currentContext: ResourceContext): {
        remainingBudget: number;
        remainingTime: number;
    }: { remainingBudget: number; remainingTime: number } {
        const newBudget = currentContext.budget - step.resourceRequirements.budget;
        const newTime = currentContext.timeWindow - step.resourceRequirements.duration;

        return {
            remainingBudget: newBudget,
            remainingTime: newTime
        };
    }

    private isFeasible(step: SchedulableStep, currentContext: ResourceContext): boolean {
        const { resourceRequirements } = step;
        return (
            resourceRequirements.budget <= currentContext.budget &&
            resourceRequirements.duration <= currentContext.timeWindow
        );
    }

    public generatePlan(): ExecutionPlan {
        let remainingContext = {
            budget: this.context.budget,
            timeWindow: this.context.timeWindow
        };

        let plan: SchedulableStep[] = [];
        let remainingSteps: SchedulableStep[] = [...this.steps];

        while (remainingSteps.length > 0) {
            let bestStepIndex = -1;
            let bestStep: SchedulableStep | null = null;
            let maxScore = -1;

            // 1. Filter feasible steps
            const feasibleSteps = remainingSteps.filter(step => this.isFeasible(step, remainingContext));

            if (feasibleSteps.length === 0) {
                break;
            }

            // 2. Score and select the best step (e.g., highest utility/lowest cost density)
            // Simple heuristic: Prioritize steps that use resources efficiently and are mandatory.
            // Here, we prioritize steps with the lowest resource cost relative to their estimated cost.
            for (let i = 0; i < feasibleSteps.length; i++) {
                const step = feasibleSteps[i];
                // Score = 1 / (Resource Cost / Estimated Cost)
                // We want to maximize this score, meaning we want high estimated cost relative to resource usage.
                const score = step.estimatedCost / Math.max(1, step.resourceRequirements.budget + step.resourceRequirements.duration);

                if (score > maxScore) {
                    maxScore = score;
                    bestStep = step;
                    bestStepIndex = remainingSteps.findIndex(s => s === step);
                }
            }

            if (!bestStep) {
                break;
            }

            // 3. Commit the step
            plan.push(bestStep);
            remainingContext = {
                budget: remainingContext.budget - bestStep.resourceRequirements.budget,
                timeWindow: remainingContext.timeWindow - bestStep.resourceRequirements.duration
            };

            // Remove the selected step from the remaining list
            remainingSteps.splice(bestStepIndex, 1);
        }

        return {
            plan: plan,
            success: plan.length > 0,
            remainingContext: remainingContext
        };
    }
}