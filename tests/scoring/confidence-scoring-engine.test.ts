import { describe, it, expect } from "vitest"
import { ConfidenceScoringEngine, ConfidenceScore } from "../src/scoring/confidence-scoring-engine"

describe("ConfidenceScoringEngine", () => {
  it("should calculate the weighted average correctly for multiple sources", () => {
    const engine = new ConfidenceScoringEngine()
    const scores: ConfidenceScore[] = [
      { score: 0.9, sourceType: "context_retrieval", weight: 0.4 },
      { score: 0.7, sourceType: "tool_execution", weight: 0.3 },
      { score: 0.95, sourceType: "plan_step", weight: 0.3 },
    ]
    // Expected calculation: (0.9 * 0.4 + 0.7 * 0.3 + 0.95 * 0.3) / (0.4 + 0.3 + 0.3)
    // Numerator: 0.36 + 0.21 + 0.285 = 0.855
    // Denominator: 1.0
    const expectedScore = 0.855
    const result = engine.calculateAggregateScore(scores)
    expect(result).toBeCloseTo(expectedScore, 3)
  })

  it("should return 0 if the list of scores is empty", () => {
    const engine = new ConfidenceScoringEngine()
    const scores: ConfidenceScore[] = []
    const result = engine.calculateAggregateScore(scores)
    expect(result).toBe(0)
  })

  it("should handle a single source score correctly", () => {
    const engine = new ConfidenceScoringEngine()
    const scores: ConfidenceScore[] = [
      { score: 0.8, sourceType: "manual", weight: 1.0 },
    ]
    // Expected calculation: (0.8 * 1.0) / 1.0 = 0.8
    const expectedScore = 0.8
    const result = engine.calculateAggregateScore(scores)
    expect(result).toBeCloseTo(expectedScore, 3)
  })
})