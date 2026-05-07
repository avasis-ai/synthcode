import { describe, it, expect } from "vitest"
import { DependencyConflictValidator } from "../src/validation/dependency-conflict-validator"

describe("DependencyConflictValidator", () => {
  it("should detect a direct circular dependency", async () => {
    const validator = new DependencyConflictValidator()
    const graph = {
      nodes: ["toolA", "toolB"],
      edges: [{ from: "toolA", to: "toolB" }, { from: "toolB", to: "toolA" }],
    }
    const result = await validator.validate(graph)
    expect(result.hasConflict).toBe(true)
    expect(result.conflictPath).toEqual(["toolA", "toolB", "toolA"])
  })

  it("should detect a longer cycle dependency", async () => {
    const validator = new DependencyConflictValidator()
    const graph = {
      nodes: ["toolA", "toolB", "toolC"],
      edges: [
        { from: "toolA", to: "toolB" },
        { from: "toolB", to: "toolC" },
        { from: "toolC", to: "toolA" },
      ],
    }
    const result = await validator.validate(graph)
    expect(result.hasConflict).toBe(true)
    expect(result.conflictPath).toHaveLength(4) // A -> B -> C -> A
  })

  it("should pass validation for a valid acyclic graph (DAG)", async () => {
    const validator = new DependencyConflictValidator()
    const graph = {
      nodes: ["toolA", "toolB", "toolC"],
      edges: [
        { from: "toolA", to: "toolB" },
        { from: "toolA", to: "toolC" },
        { from: "toolB", to: "toolC" },
      ],
    }
    const result = await validator.validate(graph)
    expect(result.hasConflict).toBe(false)
    expect(result.conflictPath).toBeUndefined()
  })
})