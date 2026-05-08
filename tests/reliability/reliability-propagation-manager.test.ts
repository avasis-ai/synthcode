import { describe, it, expect } from "vitest"
import { ReliabilityPropagationManager } from "../src/reliability/reliability-propagation-manager"

describe("ReliabilityPropagationManager", () => {
  it("should initialize correctly", () => {
    const manager = new ReliabilityPropagationManager()
    expect(manager).toBeInstanceOf(ReliabilityPropagationManager)
  })

  it("should calculate a high reliability score when given strong sources and low assumptions", () => {
    const manager = new ReliabilityPropagationManager()
    const initialPayload = {
      data: "Some data",
      reliabilityScore: 0.8,
      sources: [{ source: "SourceA", weight: 0.9 }, { source: "SourceB", weight: 0.8 }],
      assumptions: 1,
    }
    const context: any = {
      complexityScore: 0.5,
      assumptionsMade: 0.1,
      riskFactor: 0.2,
    }
    const result = manager.propagateReliability(initialPayload, context)
    expect(result.reliabilityScore).toBeGreaterThan(0.7)
  })

  it("should decrease reliability score when given weak sources or high assumptions", () => {
    const manager = new ReliabilityPropagationManager()
    const initialPayload = {
      data: "Some data",
      reliabilityScore: 0.9,
      sources: [{ source: "SourceC", weight: 0.3 }],
      assumptions: 5,
    }
    const context: any = {
      complexityScore: 0.8,
      assumptionsMade: 0.5,
      riskFactor: 0.9,
    }
    const result = manager.propagateReliability(initialPayload, context)
    expect(result.reliabilityScore).toBeLessThan(0.7)
  })
})