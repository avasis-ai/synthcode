import { describe, it, expect } from "vitest"
import { CostEstimateReport, PlanStep } from "../src/cost/plan-cost-estimator"

describe("CostEstimateReport", () => {
  it("should calculate total cost correctly for a simple plan", () => {
    const plan: PlanStep = {
      description: "Simple plan",
      requiredTokens: 1000,
      apiCalls: [
        { name: "api1", quotaCost: 0.01, usageEstimate: 50 },
        { name: "api2", quotaCost: 0.05, usageEstimate: 10 },
      ],
      computationalComplexity: "O(n)",
      estimatedDurationMs: 500,
      riskFactor: 0.1,
    }
    const report = CostEstimateReport.estimate(plan)
    expect(report.totalCostUSD).toBeCloseTo(0.1, 2)
  })

  it("should handle plans with no API calls", () => {
    const plan: PlanStep = {
      description: "No API plan",
      requiredTokens: 500,
      apiCalls: [],
      computationalComplexity: "O(1)",
      estimatedDurationMs: 100,
      riskFactor: 0.05,
    }
    const report = CostEstimateReport.estimate(plan)
    expect(report.totalCostUSD).toBeCloseTo(0.0, 2)
  })

  it("should calculate cost based on tokens and API calls accurately", () => {
    const plan: PlanStep = {
      description: "Complex plan",
      requiredTokens: 5000,
      apiCalls: [
        { name: "apiA", quotaCost: 0.1, usageEstimate: 100 },
        { name: "apiB", quotaCost: 0.02, usageEstimate: 50 },
      ],
      computationalComplexity: "O(n^2)",
      estimatedDurationMs: 2000,
      riskFactor: 0.5,
    }
    // Expected cost: (5000 * 0.0001) + (0.1 * 100) + (0.02 * 50) = 0.5 + 10 + 1 = 11.5
    const report = CostEstimateReport.estimate(plan)
    expect(report.totalCostUSD).toBeCloseTo(11.5, 2)
  })
)