import { describe, it, expect } from "vitest"
import { CredibilityGate, CredibilityScore, CredibilityReport, DataPayload } from "../src/credibility/credibility-gate.js"

describe("CredibilityGate", () => {
  it("should calculate a high overall score when all inputs are highly credible", async () => {
    const payload: DataPayload = {
      data: {
        content: "The sun is a star.",
        source: "NASA",
        timestamp: new Date(),
        sourceAuthority: "High",
        dataAge: "Fresh",
        consensus: true,
        dataType: "Scientific",
      },
      toolResults: [
        {
          toolName: "GoogleSearch",
          result: "The sun is a star.",
          resultSourceAuthority: "High",
          resultDataAge: "Fresh",
          resultConsensus: true,
        },
      ],
    }

    const report: CredibilityReport = await CredibilityGate.analyze(payload)

    expect(report.isCredible).toBe(true)
    expect(report.score.overallScore).toBeGreaterThan(4.0)
    expect(report.reasons).toContain("High authority sources were used.")
  })

  it("should calculate a low overall score when sources are outdated and lack consensus", async () => {
    const payload: DataPayload = {
      data: {
        content: "The earth is flat.",
        source: "UnknownBlog",
        timestamp: new Date("2010-01-01"),
        sourceAuthority: "Low",
        dataAge: "VeryStale",
        consensus: false,
        dataType: "Conspiracy",
      },
      toolResults: [
        {
          toolName: "Wikipedia",
          result: "The earth is round.",
          resultSourceAuthority: "Medium",
          resultDataAge: "Stale",
          resultConsensus: false,
        },
      ],
    }

    const report: CredibilityReport = await CredibilityGate.analyze(payload)

    expect(report.isCredible).toBe(false)
    expect(report.score.overallScore).toBeLessThan(2.0)
    expect(report.reasons).toContain("Low authority sources were used.")
    expect(report.reasons).toContain("Data is stale or very stale.")
  })

  it("should handle missing or incomplete data gracefully, resulting in a neutral score", async () => {
    const payload: DataPayload = {
      data: {
        content: "Some neutral information.",
        source: "Unknown",
        timestamp: new Date(),
        sourceAuthority: "Unknown",
        dataAge: "Fresh",
        consensus: false,
        dataType: "General",
      },
      toolResults: [],
    }

    const report: CredibilityReport = await CredibilityGate.analyze(payload)

    expect(report.isCredible).toBe(true) // Assuming some minimal credibility is maintained
    expect(report.score.overallScore).toBeCloseTo(2.5, 1)
    expect(report.reasons).toContain("Insufficient external verification found.")
  })
})