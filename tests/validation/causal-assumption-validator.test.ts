import { describe, it, expect } from "vitest"
import { validateCausalAssumption } from "../src/validation/causal-assumption-validator"

describe("validateCausalAssumption", () => {
  it("should return a fully supported report when evidence is strong and consistent", async () => {
    const context = {
      history: [
        { message: "A happened.", sender: "user" }
      ],
      knowledgeGraph: {
        "A": ["B"],
        "B": ["C"]
      },
      // Assuming the full context structure is available
    }
    const assumption = {
      cause: "A",
      effect: "C",
      description: "A causes C via B",
    }
    const report = await validateCausalAssumption(assumption, context)
    expect(report.isSupported).toBe(true)
    expect(report.confidenceScore).toBeGreaterThan(0.8)
    expect(report.evidence.length).toBeGreaterThan(0)
  })

  it("should return an unsupported report when evidence is missing or contradictory", async () => {
    const context = {
      history: [
        { message: "X happened.", sender: "user" }
      ],
      knowledgeGraph: {
        "X": ["Y"],
      },
    }
    const assumption = {
      cause: "X",
      effect: "Z",
      description: "X causes Z, but no link exists",
    }
    const report = await validateCausalAssumption(assumption, context)
    expect(report.isSupported).toBe(false)
    expect(report.confidenceScore).toBeLessThan(0.5)
    expect(report.reasons).toContain("Insufficient evidence to establish a causal link.")
  })

  it("should handle assumptions with no defined cause or effect", async () => {
    const context = {
      history: [],
      knowledgeGraph: {},
    }
    const assumption = {
      cause: "",
      effect: "E",
      description: "Empty cause assumption",
    }
    const report = await validateCausalAssumption(assumption, context)
    expect(report.isSupported).toBe(false)
    expect(report.confidenceScore).toBe(0)
    expect(report.reasons).toContain("Cause must be specified.")
  })
})