import { describe, it, expect } from "vitest"
import { PredictiveResourceConstraintValidator } from "../src/validation/predictive-resource-constraint-validator"
import { ConstraintSet, PlanStep, PredictionReport, ResourceUsage } from "../src/validation/types"

describe("PredictiveResourceConstraintValidator", () => {
    it("should return no violations if the plan is within all constraints", () => {
        const constraints: ConstraintSet = {
            cost: { max: 100, initial: 0 },
            tokens: { max: 500, initial: 0 },
            time: { max: 1000, initial: 0 },
            quota: { max: 10, initial: 0 },
        }
        const validator = new PredictiveResourceConstraintValidator(constraints)

        const plan: PlanStep[] = [
            { stepName: "Step 1", cost: 10, tokens: 50, time: 100, quota: 1 },
            { stepName: "Step 2", cost: 20, tokens: 100, time: 200, quota: 2 },
        ]

        const report = validator.validatePlan(plan)

        expect(report.violations).toHaveLength(0)
        expect(report.finalUsage).toEqual({
            cost: 30,
            tokens: 150,
            time: 300,
            quota: 3,
        })
    })

    it("should detect and report violations when constraints are exceeded", () => {
        const constraints: ConstraintSet = {
            cost: { max: 50, initial: 0 },
            tokens: { max: 200, initial: 0 },
            time: { max: 500, initial: 0 },
            quota: { max: 5, initial: 0 },
        }
        const validator = new PredictiveResourceConstraintValidator(constraints)

        const plan: PlanStep[] = [
            { stepName: "Step 1", cost: 30, tokens: 100, time: 200, quota: 2 },
            { stepName: "Step 2", cost: 30, tokens: 100, time: 400, quota: 4 }, // Cost violation
        ]

        const report = validator.validatePlan(plan)

        expect(report.violations).toHaveLength(1)
        expect(report.violations[0].constraintName).toBe("cost")
        expect(report.violations[0].message).toContain("exceeds maximum limit")
        expect(report.finalUsage.cost).toBe(60)
    })

    it("should handle empty plans gracefully", () => {
        const constraints: ConstraintSet = {
            cost: { max: 100, initial: 0 },
            tokens: { max: 500, initial: 0 },
            time: { max: 1000, initial: 0 },
            quota: { max: 10, initial: 0 },
        }
        const validator = new PredictiveResourceConstraintValidator(constraints)

        const plan: PlanStep[] = []

        const report = validator.validatePlan(plan)

        expect(report.violations).toHaveLength(0)
        expect(report.finalUsage).toEqual({
            cost: 0,
            tokens: 0,
            time: 0,
            quota: 0,
        })
    })
})