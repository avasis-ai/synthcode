import { describe, it, expect } from "vitest"
import { MultiObjectivePathGenerator } from "../src/planning/multi-objective-path-generator"

describe("MultiObjectivePathGenerator", () => {
  it("should generate a path and score based on provided objectives and weights", async () => {
    const generator = new MultiObjectivePathGenerator()
    const pathSteps = [
      { action: "Analyze environment", description: "Initial assessment of the situation." },
      { action: "Select optimal tool", description: "Choosing the best tool based on requirements." },
      { action: "Execute plan", description: "Implementing the chosen strategy." },
    ]
    const objectives = {
      cost: 10,
      time: 5,
      success_score: 8,
      risk_level: 2,
    }
    const weights = {
      cost: 0.5,
      time: 0.3,
      success_score: 0.4,
      risk_level: 0.1,
    }

    const scoredPath = await generator.generatePath(pathSteps, objectives, weights)

    expect(scoredPath).toBeDefined()
    expect(scoredPath!.path).toEqual(pathSteps)
    expect(scoredPath!.score).toBeCloseTo(10 * 0.5 + 5 * 0.3 + 8 * 0.4 + 2 * 0.1)
    expect(scoredPath!.rationale).toContain("The generated path is optimized")
  })

  it("should handle zero weights gracefully, resulting in a score of zero", async () => {
    const generator = new MultiObjectivePathGenerator()
    const pathSteps = [
      { action: "Step 1", description: "First step." },
      { action: "Step 2", description: "Second step." },
    ]
    const objectives = {
      cost: 10,
      time: 5,
      success_score: 8,
      risk_level: 2,
    }
    const weights = {
      cost: 0,
      time: 0,
      success_score: 0,
      risk_level: 0,
    }

    const scoredPath = await generator.generatePath(pathSteps, objectives, weights)

    expect(scoredPath).toBeDefined()
    expect(scoredPath!.score).toBe(0)
  })

  it("should return a path with the correct structure when inputs are valid", async () => {
    const generator = new MultiObjectivePathGenerator()
    const pathSteps = [
      { action: "Test Action", description: "Testing structure." },
    ]
    const objectives = {
      cost: 100,
      time: 100,
      success_score: 100,
      risk_level: 100,
    }
    const weights = {
      cost: 0.1,
      time: 0.1,
      success_score: 0.1,
      risk_level: 0.1,
    }

    const scoredPath = await generator.generatePath(pathSteps, objectives, weights)

    expect(scoredPath).toBeDefined()
    expect(scoredPath!.path).toEqual(pathSteps)
    expect(typeof scoredPath!.score).toBe("number")
    expect(scoredPath!.rationale).toBeDefined()
  })
})