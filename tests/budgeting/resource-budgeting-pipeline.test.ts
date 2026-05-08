import { describe, it, expect } from "vitest"
import { runResourceBudgetingPipeline } from "../src/budgeting/resource-budgeting-pipeline.js"

describe("runResourceBudgetingPipeline", () => {
    it("should return within budget when usage is low", async () => {
        const budgetContext = {
            maxTokens: 100,
            maxCost: 50,
            maxTimeMs: 1000,
            maxComputeUnits: 5,
        }
        const planSteps = [
            { id: "step1", type: "text_generation", details: {} },
            { id: "step2", type: "tool_call", details: {} },
        ]
        const report = await runResourceBudgetingPipeline(planSteps, budgetContext)

        expect(report.isWithinBudget).toBe(true)
        expect(report.totalUsage.tokens).toBeGreaterThan(0)
    })

    it("should report over budget when tokens are exceeded", async () => {
        const budgetContext = {
            maxTokens: 10,
            maxCost: 100,
            maxTimeMs: 1000,
            maxComputeUnits: 5,
        }
        const planSteps = [
            { id: "step1", type: "text_generation", details: { tokens: 50 } },
        ]
        const report = await runResourceBudgetingPipeline(planSteps, budgetContext)

        expect(report.isWithinBudget).toBe(false)
        expect(report.totalUsage.tokens).toBe(50)
        expect(report.warnings).toContain("Tokens exceeded budget limit")
    })

    it("should correctly calculate usage across multiple steps", async () => {
        const budgetContext = {
            maxTokens: 200,
            maxCost: 100,
            maxTimeMs: 5000,
            maxComputeUnits: 10,
        }
        const planSteps = [
            { id: "step1", type: "text_generation", details: { tokens: 50, cost: 10 } },
            { id: "step2", type: "tool_call", details: { tokens: 100, cost: 30, timeMs: 200 } },
            { id: "step3", type: "other", details: { tokens: 50, cost: 10 } },
        ]
        const report = await runResourceBudgetingPipeline(planSteps, budgetContext)

        expect(report.totalUsage.tokens).toBe(200)
        expect(report.totalUsage.cost).toBe(50)
        expect(report.totalUsage.timeMs).toBe(200)
        expect(report.totalUsage.computeUnits).toBe(0)
        expect(report.isWithinBudget).toBe(true)
    })
})