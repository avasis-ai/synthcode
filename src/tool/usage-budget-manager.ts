export class BudgetExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BudgetExceededError";
    }
}

export type CostCalculator = (usage: Record<string, number>) => Record<string, number>;

export interface UsageBudget {
    limits: Record<string, number>;
    calculateCost: CostCalculator;
}

export class UsageBudgetManager {
    private currentUsage: Record<string, number>;
    private budget: UsageBudget;

    constructor(budget: UsageBudget) {
        this.budget = budget;
        this.currentUsage = {
            total_calls: 0,
            total_tokens: 0,
            ...Object.keys(budget.limits).reduce((acc, key) => {
                acc[key as string] = 0;
                return acc;
            }, {} as Record<string, number>)
        };
    }

    private getRemainingBudget(key: string): number {
        const limit = this.budget.limits[key] ?? 0;
        const used = this.currentUsage[key] ?? 0;
        return Math.max(0, limit - used);
    }

    public checkUsage(usageDelta: Record<string, number>): void {
        const newUsage = { ...this.currentUsage };
        let totalCost: Record<string, number> = {
            total_calls: 0,
            total_tokens: 0,
            ...Object.keys(this.budget.limits).reduce((acc, key) => {
                acc[key as string] = 0;
                return acc;
            }, {} as Record<string, number>)
        };

        // Calculate the projected total usage after this delta
        for (const key in usageDelta) {
            if (typeof (usageDelta[key] as number) === 'number') {
                (newUsage as any)[key] = (newUsage as any)[key] + (usageDelta[key] as number);
            }
        }

        // Check against all defined limits
        for (const limitKey in this.budget.limits) {
            const limit = this.budget.limits[limitKey];
            const projectedUsage = (newUsage as any)[limitKey] ?? 0;

            if (projectedUsage > limit) {
                throw new BudgetExceededError(
                    `Usage for '${limitKey}' would exceed the budget. Limit: ${limit}, Projected Usage: ${projectedUsage}`
                );
            }
        }
    }

    public recordUsage(usageDelta: Record<string, number>): void {
        this.checkUsage(usageDelta);
        for (const key in usageDelta) {
            if (typeof (usageDelta[key] as number) === 'number') {
                (this.currentUsage as any)[key] = (this.currentUsage as any)[key] + (usageDelta[key] as number);
            }
        }
    }

    public getRemainingBudgetReport(): Record<string, number> {
        const report: Record<string, number> = {};
        for (const key in this.budget.limits) {
            const limit = this.budget.limits[key];
            const used = (this.currentUsage as any)[key] ?? 0;
            report[key] = Math.max(0, limit - used);
        }
        return report;
    }
}