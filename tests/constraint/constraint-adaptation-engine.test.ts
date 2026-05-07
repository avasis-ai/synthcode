import { describe, it, expect } from "vitest"
import { ConstraintAdaptationEngine } from "../src/constraint/constraint-adaptation-engine.js"

describe("ConstraintAdaptationEngine", () => {
  it("should initialize correctly with valid constraints", () => {
    const engine = new ConstraintAdaptationEngine([
      { id: "c1", type: "resource_limit", config: { maxCpu: 8 } },
      { id: "c2", type: "temporal_window", config: { start: 0, end: 100 } },
    ])
    expect(engine).toBeDefined()
  })

  it("should detect a resource limit violation when resources are exceeded", () => {
    const engine = new ConstraintAdaptationEngine([
      { id: "c1", type: "resource_limit", config: { maxCpu: 4 } },
    ])
    const violation = engine.checkViolation({
      resource: "cpu",
      currentUsage: 6,
      maxAllowed: 4,
    })
    expect(violation).toEqual(expect.objectContaining({
      violationDetails: expect.objectContaining({
        violationType: "resource_limit",
        message: expect.stringContaining("CPU usage exceeds limit"),
      }),
    }))
  })

  it("should not report a violation when constraints are met", () => {
    const engine = new ConstraintAdaptationEngine([
      { id: "c1", type: "resource_limit", config: { maxCpu: 8 } },
    ])
    const violation = engine.checkViolation({
      resource: "cpu",
      currentUsage: 7,
      maxAllowed: 8,
    })
    expect(violation).toBeNull()
  })
})