import { describe, it, expect, vi } from "vitest"
import {
  FailureDetail,
  FailureReport,
  SystemicFailureAnalysisEngine,
} from "../src/analysis/systemic-failure-analysis-engine"

describe("SystemicFailureAnalysisEngine", () => {
  it("should initialize correctly and generate a basic report", () => {
    const engine = new SystemicFailureAnalysisEngine()
    const report = engine.generateReport("test-run-id")

    expect(report).toBeDefined()
    expect(report!.runId).toBe("test-run-id")
    expect(report!.details).toBeInstanceOf(Array)
    expect(report!.details.length).toBe(0)
    expect(report!.timestamp).toBeInstanceOf(Date)
  })

  it("should add failure details to the report accurately", () => {
    const engine = new SystemicFailureAnalysisAnalysisEngine()
    const detail1: FailureDetail = {
      type: "ResourceConstraintViolation",
      message: "Memory limit exceeded",
      severity: "CRITICAL",
      context: { resource: "memory", limit: 1024 },
    }
    const detail2: FailureDetail = {
      type: "SchemaDrift",
      message: "Field 'user_id' missing",
      severity: "ERROR",
      context: { schema: "user_data" },
    }

    engine.addFailureDetail(detail1)
    engine.addFailureDetail(detail2)

    const report = engine.generateReport("test-run-id")

    expect(report!.details).toHaveLength(2)
    expect(report!.details).toContainEqual(detail1)
    expect(report!.details).toContainEqual(detail2)
  })

  it("should handle multiple failure types and update the report state", () => {
    const engine = new SystemicFailureAnalysisEngine()
    const detail1: FailureDetail = {
      type: "HighLoad",
      message: "Service latency spike detected",
      severity: "WARNING",
      context: { service: "auth", latency_ms: 500 },
    }
    const detail2: FailureDetail = {
      type: "UnknownFailure",
      message: "Unexpected system halt",
      severity: "CRITICAL",
      context: { component: "core" },
    }

    engine.addFailureDetail(detail1)
    engine.addFailureDetail(detail2)

    const report = engine.generateReport("test-run-id")

    expect(report!.details).toHaveLength(2)
    expect(report!.details.some(d => d.type === "HighLoad")).toBe(true)
    expect(report!.details.some(d => d.type === "UnknownFailure")).toBe(true)
  })
})