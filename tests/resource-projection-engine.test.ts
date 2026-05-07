import { describe, it, expect } from "vitest"
import { ResourceProjectionEngine, ResourceRequirement, Plan } from "../src/resource/resource-projection-engine"

describe("ResourceProjectionEngine", () => {
  it("should calculate total resource usage correctly for a simple plan", () => {
    const engine = new ResourceProjectionEngine()
    const plan: Plan = {
      steps: [
        {
          stepId: "step1",
          description: "Initial setup",
          requirements: [
            { resourceName: "cpu", usageAmount: 2, durationSeconds: 10 },
            { resourceName: "memory", usageAmount: 4, durationSeconds: 10 },
          ],
        },
        {
          stepId: "step2",
          description: "Processing",
          requirements: [
            { resourceName: "cpu", usageAmount: 1, durationSeconds: 5 },
            { resourceName: "memory", usageAmount: 2, durationSeconds: 5 },
          ],
        },
      ],
    }
    const result = engine.project(plan)
    expect(result.success).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.finalUsage).toEqual({
      cpu: 3,
      memory: 6,
    })
  })

  it("should handle resource constraints and report failure if exceeded", () => {
    const engine = new ResourceProjectionEngine()
    const plan: Plan = {
      steps: [
        {
          stepId: "step1",
          description: "Setup",
          requirements: [
            { resourceName: "cpu", usageAmount: 5, durationSeconds: 10 },
          ],
        },
        {
          stepId: "step2",
          description: "Heavy load",
          requirements: [
            { resourceName: "cpu", usageAmount: 3, durationSeconds: 5 },
          ],
        },
      ],
    }
    // Assuming a constraint check is implemented (e.g., max CPU = 7)
    // For this test, we assume the engine detects a failure based on internal logic.
    // Since the actual constraint logic isn't provided, we test the failure path.
    // We assume the engine fails if total CPU usage exceeds a hypothetical limit (e.g., 7).
    // Total usage: 5 + 3 = 8.
    const result = engine.project(plan)
    expect(result.success).toBe(false)
    expect(result.warnings).toContain("Resource constraint exceeded for cpu")
  })

  it("should return zero usage for resources not used in the plan", () => {
    const engine = new ResourceProjectionEngine()
    const plan: Plan = {
      steps: [
        {
          stepId: "step1",
          description: "Setup",
          requirements: [
            { resourceName: "cpu", usageAmount: 1, durationSeconds: 10 },
          ],
        },
      ],
    }
    const result = engine.project(plan)
    expect(result.success).toBe(true)
    expect(result.warnings).toHaveLength(0)
    expect(result.finalUsage).toEqual({
      cpu: 1,
      memory: 0,
      disk: 0,
    })
  })
})