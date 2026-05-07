export type ComplexityScore = {
    latency: number;
    resourceIntensity: number;
    modelCost: number;
};

export interface ComplexityEstimator {
    /**
     * Estimates the computational complexity score for this step.
     * @returns The complexity score object.
     */
    estimateComplexity(): ComplexityScore;
}

export class BudgetExceededError extends Error {
    private readonly actualScore: ComplexityScore;
    private readonly budget: ComplexityScore;

    constructor(message: string, actualScore: ComplexityScore, budget: ComplexityScore) {
        super(message);
        this.actualScore = actualScore;
        this.budget = budget;
        Object.setPrototypeOf(this, BudgetExceededError.prototype);
    }

    getActualScore(): ComplexityScore {
        return this.actualScore;
    }

    getBudget(): ComplexityScore {
        return this.budget;
    }
}

export class ComputationalComplexityBudgetManager {
    private readonly budget: ComplexityScore;

    constructor(budget: ComplexityScore) {
        this.budget = budget;
    }

    /**
     * Calculates the total complexity score for a sequence of steps.
     * @param plan An array of steps, each implementing ComplexityEstimator.
     * @returns The aggregated complexity score.
     */
    private calculateTotalComplexity(plan: ComplexityEstimator[]): ComplexityScore {
        return plan.reduce((acc, step) => {
            const score = step.estimateComplexity();
            return {
                latency: acc.latency + score.latency,
                resourceIntensity: acc.resourceIntensity + score.resourceIntensity,
                modelCost: acc.modelCost + score.modelCost,
            };
        }, { latency: 0, resourceIntensity: 0, modelCost: 0 });
    }

    /**
     * Checks if the cumulative complexity of the plan exceeds the defined budget.
     * @param plan The sequence of steps to evaluate.
     * @throws BudgetExceededError if the total complexity exceeds the budget.
     */
    public checkBudget(plan: ComplexityEstimator[]): void {
        const totalComplexity = this.calculateTotalComplexity(plan);

        const checkExceeded = (actual: number, limit: number, metric: string) => {
            if (actual > limit) {
                throw new BudgetExceededError(
                    `Computational budget exceeded for ${metric}. Actual: ${actual.toFixed(2)}, Limit: ${limit.toFixed(2)}`,
                    { latency: 0, resourceIntensity: 0, modelCost: 0 }, // Dummy score for error context
                    this.budget
                );
            }
        };

        try {
            checkExceeded(totalComplexity.latency, this.budget.latency, "latency");
            checkExceeded(totalComplexity.resourceIntensity, this.budget.resourceIntensity, "resourceIntensity");
            checkExceeded(totalComplexity.modelCost, this.budget.modelCost, "modelCost");
        } catch (e) {
            if (e instanceof BudgetExceededError) {
                throw e;
            }
            throw new Error("Failed to check computational budget.");
        }
    }

    /**
     * Gets the total complexity score without checking the budget.
     * @param plan The sequence of steps to evaluate.
     * @returns The aggregated complexity score.
     */
    public getTotalComplexity(plan: ComplexityEstimator[]): ComplexityScore {
        return this.calculateTotalComplexity(plan);
    }
}

export {
    ComputationalComplexityBudgetManager,
    BudgetExceededError,
    ComplexityEstimator
}