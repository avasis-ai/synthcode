import { ResourceUsage, ConstraintSet, PlanStep, PredictionReport } from "./types";

export class PredictiveResourceConstraintValidator {
    private constraints: ConstraintSet;

    constructor(constraints: ConstraintSet) {
        this.constraints = constraints;
    }

    validatePlan(plan: PlanStep[]): PredictionReport {
        let currentUsage: ResourceUsage = {
            cost: 0,
            tokens: 0,
            time: 0,
            quota: 0,
        };
        const violations: string[] = [];

        for (let i = 0; i < plan.length; i++) {
            const step = plan[i];

            // Accumulate usage
            currentUsage = {
                cost: currentUsage.cost + step.usage.cost,
                tokens: currentUsage.tokens + step.usage.tokens,
                time: currentUsage.time + step.usage.time,
                quota: currentUsage.quota + step.usage.quota,
            };

            // Check constraints
            if (currentUsage.cost > this.constraints.maxCost) {
                violations.push(
                    `Cost exceeded. Current total: ${currentUsage.cost.toFixed(2)}, Max allowed: ${this.constraints.maxCost.toFixed(2)}.`
                );
            }
            if (currentUsage.tokens > this.constraints.maxTokens) {
                violations.push(
                    `Token limit exceeded. Current total: ${currentUsage.tokens}, Max allowed: ${this.constraints.maxTokens}.`
                );
            }
            if (currentUsage.time > this.constraints.maxTime) {
                violations.push(
                    `Time limit exceeded. Current total: ${currentUsage.time.toFixed(2)}, Max allowed: ${this.constraints.maxTime.toFixed(2)}.`
                );
            }
            if (currentUsage.quota > this.constraints.maxQuota) {
                violations.push(
                    `Quota limit exceeded. Current total: ${currentUsage.quota}, Max allowed: ${this.constraints.maxQuota}.`
                );
            }
        }

        const isValid = violations.length === 0;

        return {
            isValid: isValid,
            violations: violations,
            finalUsage: currentUsage,
        };
    }
}