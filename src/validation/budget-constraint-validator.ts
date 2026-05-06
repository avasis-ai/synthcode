class BudgetExceededError extends Error {
    constructor(message: string, public currentCost: number, public maxCost: number) {
        super(message);
        this.name = "BudgetExceededError";
    }
}

export interface BudgetConstraint {
    maxCost: number;
    maxResources: number;
}

export interface CostEstimate {
    cost: number;
    resources: number;
}

export interface PlanStep {
    // Represents a single action or tool call in the plan
    id: string;
    type: string;
    input: Record<string, unknown>;
}

export class BudgetConstraintValidator {
    private budget: BudgetConstraint;
    private costEstimator: (step: PlanStep) => Promise<CostEstimate>;

    constructor(budget: BudgetConstraint, costEstimator: (step: PlanStep) => Promise<CostEstimate>) {
        this.budget = budget;
        this.costEstimator = costEstimator;
    }

    /**
     * Validates an entire plan sequence against the defined budget constraints.
     * Throws BudgetExceededError if the cumulative cost or resource usage exceeds limits.
     * @param plan The sequence of steps to be executed.
     */
    public async validatePlan(plan: PlanStep[]): Promise<void> {
        let accumulatedCost = 0;
        let accumulatedResources = 0;

        for (const step of plan) {
            try {
                const estimate = await this.costEstimator(step);
                
                accumulatedCost += estimate.cost;
                accumulatedResources += estimate.resources;

                if (accumulatedCost > this.budget.maxCost) {
                    throw new BudgetExceededError(
                        `Planned execution exceeds the maximum cost budget. Current cumulative cost: ${accumulatedCost.toFixed(2)} (Limit: ${this.budget.maxCost.toFixed(2)})`,
                        accumulatedCost,
                        this.budget.maxCost
                    );
                }

                if (accumulatedResources > this.budget.maxResources) {
                    throw new BudgetExceededError(
                        `Planned execution exceeds the maximum resource budget. Current cumulative resources: ${accumulatedResources.toFixed(2)} (Limit: ${this.budget.maxResources.toFixed(2)})`,
                        accumulatedCost,
                        this.budget.maxCost
                    );
                }
            } catch (error) {
                // Re-throw specific budget errors, or handle unexpected cost estimation failures
                if (error instanceof BudgetExceededError) {
                    throw error;
                }
                throw new Error(`Failed to estimate cost for step ${step.id}: ${(error as Error).message}`);
            }
        }
    }
}

export { BudgetExceededError, BudgetConstraintValidator }