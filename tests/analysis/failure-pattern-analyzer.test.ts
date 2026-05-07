import { describe, it, expect, vi } from "vitest"
import { FailurePatternAnalyzer } from "../src/analysis/failure-pattern-analyzer.js"

describe("FailurePatternAnalyzer", () => {
  it("should correctly analyze a simple set of failure reports", async () => {
    const analyzer = new FailurePatternAnalyzer()
    const reports = [
      {
        timestamp: new Date(),
        failureType: "ResourceConflict",
        context: "Database write failure",
        components: ["Auth", "DB"],
        details: { code: 1001 }
      },
      {
        timestamp: new Date(),
        failureType: "ResourceConflict",
        context: "Database write failure",
        components: ["Auth", "DB"],
        details: { code: 1001 }
      },
      {
        timestamp: new Date(),
        failureType: "SchemaMismatch",
        context: "API payload validation",
        components: ["API"],
        details: {}
      },
    ]
    await analyzer.analyze(reports)
    const patterns = analyzer.getPatterns()

    expect(patterns).toHaveLength(2)
    const conflictPattern = patterns.find(p => p.type === "ResourceConflict")
    expect(conflictPattern).toBeDefined()
    expect(conflictPattern!.count).toBe(2)
    expect(conflictPattern!.components).toEqual(new Set(["Auth", "DB"]))

    const mismatchPattern = patterns.find(p => p.type === "SchemaMismatch")
    expect(mismatchPattern).toBeDefined()
    expect(mismatchPattern!.count).toBe(1)
    expect(mismatchPattern!.components).toEqual(new Set(["API"]))
  })

  it("should handle mixed failure types and calculate correlation score", async () => {
    const analyzer = new FailurePatternAnalyzer()
    const reports = [
      {
        timestamp: new Date(),
        failureType: "NetworkError",
        context: "Timeout connecting to external service",
        components: ["ServiceA", "Network"],
        details: { endpoint: "external" }
      },
      {
        timestamp: new Date(),
        failureType: "NetworkError",
        context: "Timeout connecting to external service",
        components: ["ServiceA", "Network"],
        details: { endpoint: "external" }
      },
      {
        timestamp: new Date(),
        failureType: "ValidationFailure",
        context: "Input data too short",
        components: ["InputValidator"],
        details: { field: "username" }
      },
    ]
    await analyzer.analyze(reports)
    const patterns = analyzer.getPatterns()

    expect(patterns).toHaveLength(2)
    const networkPattern = patterns.find(p => p.type === "NetworkError")
    expect(networkPattern).toBeDefined()
    expect(networkPattern!.count).toBe(2)
    expect(networkPattern!.components).toEqual(new Set(["ServiceA", "Network"]))

    const validationPattern = patterns.find(p => p.type === "ValidationFailure")
    expect(validationPattern).toBeDefined()
    expect(validationPattern!.count).toBe(1)
    expect(validationPattern!.components).toEqual(new Set(["InputValidator"]))
  })

  it("should reset patterns when analyze is called multiple times", async () => {
    const analyzer = new FailurePatternAnalyzer()
    const reports1 = [
      {
        timestamp: new Date(),
        failureType: "ResourceConflict",
        context: "Initial failure",
        components: ["A"],
        details: {}
      }
    ]
    await analyzer.analyze(reports1)
    let patterns = analyzer.getPatterns()
    expect(patterns).toHaveLength(1)

    // Analyze a second, different set of reports
    const reports2 = [
      {
        timestamp: new Date(),
        failureType: "SchemaMismatch",
        context: "Second failure",
        components: ["B"],
        details: {}
      }
    ]
    await analyzer.analyze(reports2)
    patterns = analyzer.getPatterns()
    expect(patterns).toHaveLength(1)
    expect(patterns[0].type).toBe("SchemaMismatch")
  })
})