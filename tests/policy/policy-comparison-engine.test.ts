import { describe, it, expect } from "vitest"
import { PolicyComparisonEngine } from "../src/policy/policy-comparison-engine.js"

describe("PolicyComparisonEngine", () => {
  it("should correctly compare two policies and identify the better one", async () => {
    const policyA = {
      id: "policyA",
      description: "Policy A is good",
      executePolicy: async (history, userPrompt) => {
        // Simulate execution for policy A
        return {
          finalState: [...history, { type: "AssistantMessage", content: "Result A" }],
          metrics: { cost: 10, successRate: 0.9 },
        }
      },
    }
    const policyB = {
      id: "policyB",
      description: "Policy B is better",
      executePolicy: async (history, userPrompt) => {
        // Simulate execution for policy B
        return {
          finalState: [...history, { type: "AssistantMessage", content: "Result B" }],
          metrics: { cost: 5, successRate: 0.95 },
        }
      },
    }
    const engine = new PolicyComparisonEngine();
    const comparison = await engine.comparePolicies(policyA, policyB, [], "Test Prompt")

    expect(comparison.winnerId).toBe("policyB")
    expect(comparison.winnerMetrics.cost).toBe(5)
    expect(comparison.winnerMetrics.successRate).toBe(0.95)
  })

  it("should handle cases where policies perform equally well", async () => {
    const policyA = {
      id: "policyA",
      description: "Policy A is average",
      executePolicy: async (history, userPrompt) => {
        return {
          finalState: [...history, { type: "AssistantMessage", content: "Result A" }],
          metrics: { cost: 10, successRate: 0.8 },
        }
      },
    }
    const policyB = {
      id: "policyB",
      description: "Policy B is average",
      executePolicy: async (history, userPrompt) => {
        return {
          finalState: [...history, { type: "AssistantMessage", content: "Result B" }],
          metrics: { cost: 10, successRate: 0.8 },
        }
      },
    }
    const engine = new PolicyComparisonEngine();
    const comparison = await engine.comparePolicies(policyA, policyB, [], "Test Prompt")

    // Assuming the comparison logic defaults to the first policy if metrics are equal
    expect(comparison.winnerId).toBe("policyA")
    expect(comparison.winnerMetrics.cost).toBe(10)
  })

  it("should handle policy execution failures gracefully", async () => {
    const policyA = {
      id: "policyA",
      description: "Policy A fails",
      executePolicy: async (history, userPrompt) => {
        throw new Error("Policy A failed to execute");
      },
    }
    const policyB = {
      id: "policyB",
      description: "Policy B succeeds",
      executePolicy: async (history, userPrompt) => {
        return {
          finalState: [...history, { type: "AssistantMessage", content: "Result B" }],
          metrics: { cost: 5, successRate: 0.95 },
        }
      },
    }
    const engine = new PolicyComparisonEngine();
    const comparison = await engine.comparePolicies(policyA, policyB, [], "Test Prompt")

    expect(comparison.winnerId).toBe("policyB")
    expect(comparison.winnerMetrics.cost).toBe(5)
  })
})