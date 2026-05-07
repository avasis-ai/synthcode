import { describe, it, expect } from "vitest"
import { ConflictPrioritizer, Conflict, WeightMap } from "../src/conflict/conflict-prioritizer"

describe("ConflictPrioritizer", () => {
  it("should calculate the weighted score correctly for a given conflict and weights", () => {
    const prioritizer = new ConflictPrioritizer()
    const conflict: Conflict = { type: "GOAL", severity: 5, source: "A" }
    const weights: WeightMap = {
      GOAL: 2,
      RESOURCE: 1,
      CAPABILITY: 3,
    }
    // Expected score: severity * weight_for_type = 5 * 2 = 10
    expect(prioritizer.calculateScore(conflict, weights)).toBe(10)
  })

  it("should return 0 if the conflict type is not present in the weights map", () => {
    const prioritizer = new ConflictPrioritizer()
    const conflict: Conflict = { type: "UNKNOWN_TYPE", severity: 10, source: "B" }
    const weights: WeightMap = {
      GOAL: 2,
      RESOURCE: 1,
    }
    // Expected score: severity * weight_for_type = 10 * 0 = 0
    expect(prioritizer.calculateScore(conflict, weights)).toBe(0)
  })

  it("should handle zero severity conflicts correctly", () => {
    const prioritizer = new ConflictPrioritizer()
    const conflict: Conflict = { type: "CAPABILITY", severity: 0, source: "C" }
    const weights: WeightMap = {
      GOAL: 2,
      CAPABILITY: 3,
    }
    // Expected score: severity * weight_for_type = 0 * 3 = 0
    expect(prioritizer.calculateScore(conflict, weights)).toBe(0)
  })
})