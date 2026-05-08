import { describe, it, expect } from "vitest"
import { SemanticConflictPredictor } from "../src/conflict/semantic-conflict-predictor"

describe("SemanticConflictPredictor", () => {
  it("should correctly identify a clear semantic conflict", () => {
    const predictor = new SemanticConflictPredictor(0.5)
    const context = "The user is planning a trip to Paris."
    const goal = "The user wants to visit the Louvre Museum."
    const action = "The user booked a flight to Rome."

    const report = predictor.predictConflict(context, goal, action)

    expect(report.isConflicting).toBe(true)
    expect(report.score).toBeGreaterThan(0.8)
    expect(report.conflictingTriples.length).toBeGreaterThan(0)
    expect(report.summary).toContain("conflict")
  })

  it("should report no conflict when goal and action are consistent", () => {
    const predictor = new SemanticConflictPredictor(0.5)
    const context = "The user is planning a trip to Paris."
    const goal = "The user wants to visit the Eiffel Tower."
    const action = "The user booked a hotel near the Eiffel Tower."

    const report = predictor.predictConflict(context, goal, action)

    expect(report.isConflicting).toBe(false)
    expect(report.score).toBeLessThan(0.2)
    expect(report.conflictingTriples.length).toBe(0)
    expect(report.summary).toContain("consistent")
  })

  it("should handle empty or minimal inputs gracefully", () => {
    const predictor = new SemanticConflictPredictor(0.5)
    const context = ""
    const goal = ""
    const action = ""

    const report = predictor.predictConflict(context, goal, action)

    expect(report.isConflicting).toBe(false)
    expect(report.score).toBeCloseTo(0, 2)
    expect(report.conflictingTriples.length).toBe(0)
  })
})