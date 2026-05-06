import { describe, it, expect } from "vitest";
import { BudgetConstraint, CostEstimate, PlanStep } from "../src/validation/budget-constraint-validator";
import { validatePlanAgainstBudget } from "../src/validation/budget-constraint-validator";

describe("validatePlanAgainstBudget", () => {
    it("should pass validation when total cost and resources are within budget constraints", () => {
        const budget: BudgetConstraint = { maxCost: 100, maxResources: 5 };
        const plan: PlanStep[] = [
            { id: "step1", type: "toolA", input: { cost: 20, resources: 1 } },
            { id: "step2", type: "toolB", input: { cost: 50, resources: 3 } },
            { id: "step3", type: "toolC", input: { cost: 30, resources: 1 } },
        ];
        const result = validatePlanAgainstBudget(plan, budget);
        expect(result).toBeNull();
    });

    it("should return an error when the total cost exceeds the maximum budget", () => {
        const budget: BudgetConstraint = { maxCost: 100, maxResources: 5 };
        const plan: PlanStep[] = [
            { id: "step1", type: "toolA", input: { cost: 50, resources: 1 } },
            { id: "step2", type: "toolB", input: { cost: 60, resources: 3 } }, // Total cost: 110
        ];
        const error = validatePlanAgainstBudget(plan, budget);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(Error); // Assuming the implementation throws or returns a specific error type
        expect((error as any).name).toBe("BudgetExceededError");
        expect((error as any).currentCost).toBe(110);
        expect((error as any).maxCost).toBe(100);
    });

    it("should return an error when total resources exceed the maximum allowed resources", () => {
        const budget: BudgetConstraint = { maxCost: 100, maxResources: 2 };
        const plan: PlanStep[] = [
            { id: "step1", type: "toolA", input: { cost: 10, resources: 1 } },
            { id: "step2", type: "toolB", input: { cost: 10, resources: 2 } }, // Total resources: 3
        ];
        const error = validatePlanAgainstBudget(plan, budget);
        expect(error).toBeInstanceOf(Error);
        // Note: If the validator only checks cost and throws a generic error, this test might need adjustment.
        // Assuming the validator handles resource overruns by throwing or returning a specific error structure.
        // For this test, we assume the error structure is consistent or that the validator throws a specific error.
        // Since the provided snippet only shows cost-related error, we test for the general failure case.
        // If the validator throws a single BudgetExceededError, we check if the error message indicates resource failure.
        if (typeof error === 'object' && error !== null && 'message' in error) {
            expect((error as any).message).toContain("exceeds maximum resources");
        }
    });
});