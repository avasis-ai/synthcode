import { describe, it, expect } from "vitest"
import { ExpertConsensusEngine, ExpertInput, ConflictReport, ConsensusResult } from "../../../src/consensus/expert-consensus-engine"

describe("ExpertConsensusEngine", () => {
  it("should correctly calculate consensus when all experts agree", () => {
    const engine = new ExpertConsensusEngine()
    const input1: ExpertInput = { expertId: "A", confidenceScore: 0.9, proposedAction: "ActionX" }
    const input2: ExpertInput = { expertId: "B", confidenceScore: 0.8, proposedAction: "ActionX" }
    const input3: ExpertInput = { expertId: "C", confidenceScore: 0.7, proposedAction: "ActionX" }

    engine.submitInput(input1)
    engine.submitInput(input2)
    engine.submitInput(input3)

    const result: ConsensusResult = engine.calculateConsensus()

    expect(result.finalAction).toBe("ActionX")
    expect(result.weightedScore).toBeCloseTo(2.4)
    expect(result.conflictReport.disagreements).toEqual({})
  })

  it("should identify the most frequent action and calculate weighted score correctly when there is disagreement", () => {
    const engine = new ExpertConsensusEngine()
    const input1: ExpertInput = { expertId: "A", confidenceScore: 0.9, proposedAction: "ActionY" }
    const input2: ExpertInput = { expertId: "B", confidenceScore: 0.8, proposedAction: "ActionZ" }
    const input3: ExpertInput = { expertId: "C", confidenceScore: 0.7, proposedAction: "ActionY" }
    const input4: ExpertInput = { expertId: "D", confidenceScore: 0.6, proposedAction: "ActionZ" }

    engine.submitInput(input1)
    engine.submitInput(input2)
    engine.submitInput(input3)
    engine.submitInput(input4)

    const result: ConsensusResult = engine.calculateConsensus()

    expect(result.finalAction).toBe("ActionY")
    // Weighted score: (0.9 + 0.7) + (0.8 + 0.6) = 1.6 + 1.4 = 3.0
    expect(result.weightedScore).toBeCloseTo(3.0)
    expect(result.conflictReport.disagreements).toEqual({ "ActionY": 2, "ActionZ": 2 })
  })

  it("should handle an empty set of inputs gracefully", () => {
    const engine = new ExpertConsensusEngine()
    const result: ConsensusResult = engine.calculateConsensus()

    expect(result.finalAction).toBe("")
    expect(result.weightedScore).toBe(0)
    expect(result.conflictReport.disagreements).toEqual({})
  })
})