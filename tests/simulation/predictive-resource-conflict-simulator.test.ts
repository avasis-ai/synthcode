import { describe, it, expect } from "vitest"
import {
  ResourceState,
  SimulationStep,
  ConflictReport,
} from "../src/simulation/predictive-resource-conflict-simulator"
import {predictiveResourceConflictSimulator} from "../src/simulation/predictive-resource-conflict-simulator"

describe("predictiveResourceConflictSimulator", () => {
  it("should detect a simple resource conflict when usage exceeds capacity", async () => {
    const resourceState: ResourceState = {
      capacity: {cpu: 10, memory: 50},
      initialUsage: {cpu: 2, memory: 10 },
    }
    const steps: SimulationStep[] = [
      {name: "Step 1", resourceRequirements: {cpu: 3, memory: 5}, durationSeconds: 1},
      {name: "Step 2", resourceRequirements: {cpu: 8, memory: 10}, durationSeconds: 2}, // Conflict here
      {name: "Step 3", resourceRequirements: {cpu: 1, memory: 1}, durationSeconds: 1},
    ]

    const report: ConflictReport = await predictiveResourceConflictSimulator(
      resourceState, steps
    )

    expect(report.isConflict).toBe(true)
    expect(report.conflicts.length).toBe(1)
    expect(report.conflicts[0].stepName).toBe("Step 2")
    expect(report.conflicts[0].resource).toBe("cpu")
    expect(report.conflicts[0].exceededCapacity).toBe(
      10 - 2
    )
    expect(report.conflicts[0].currentUsage).toBe(
      10 + 8
    )
  })

  it("should not detect a conflict when total usage remains within capacity", async () => {
    const resourceState: ResourceState = {
      capacity: {cpu: 20, memory: 100 },
      initialUsage: {cpu: 5, memory: 20 },
    }
    const steps: SimulationStep[] = [
      {name: "Step A", resourceRequirements: {cpu: 5, memory: 30}, durationSeconds: 1},
      {name: "Step B", resourceRequirements: {cpu: 10, memory: 50}, durationSeconds: 2},
      {name: "Step C", resourceRequirements: {cpu: 3, memory: 10}, durationSeconds: 1},
    ]

    const report: ConflictReport = await predictiveResourceConflictSimulator(
      resourceState, steps
    )

    expect(report.isConflict).toBe(false)
    expect(report.conflicts.length).toBe(0)
  })

  it("should handle multiple conflicts across different resources and steps", async () => {
    const resourceState: ResourceState = {
      capacity: {cpu: 15, memory: 50},
      initialUsage: {cpu: 5, memory: 10 },
    }
    const steps: SimulationStep[] = [
      {name: "Step 1", resourceRequirements: {cpu: 10, memory: 5}, durationSeconds: 1},
      {name: "Step 2", resourceRequirements: {cpu: 6, memory: 45}, durationSeconds: 2}, // Conflict: Memory
      {name: "Step 3", resourceRequirements: {cpu: 12, memory: 10}, durationSeconds: 1}, // Conflict: CPU
    ]

    const report: ConflictReport = await predictiveResourceConflictSimulator(
      resourceState, steps
    )

    expect(report.isConflict).toBe(true)
    expect(report.conflicts.length).toBe(2)

    // Check the first conflict (Step 2, Memory)
    const conflict2 = report.conflicts.find(
      (c) => c.stepName === "Step 2" && c.resource === "memory"
    )
    expect(conflict2).toBeDefined()
    expect(conflict2!.exceededCapacity).toBe(
      50 - 10
    )
    expect(conflict2!.currentUsage).toBe(
      10 + 45
    )

    // Check the second conflict (Step 3, CPU)
    const conflict3 = report.conflicts.find(
      (c) => c.stepName === "Step 3" && c.resource === "cpu"
    )
    expect(conflict3).toBeDefined()
    expect(conflict3!.exceededCapacity).toBe(
      15 - 5
    )
    expect(conflict3!.currentUsage).toBe(
      5 + 12
    )
  })
})