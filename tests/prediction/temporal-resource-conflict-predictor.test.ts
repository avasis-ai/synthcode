import { describe, it, expect } from "vitest"
import {
  ResourceType,
  ResourceUsage,
  PlanStep,
  ConflictDetail,
  MitigationSuggestion,
  TemporalResourceConflictPredictor,
} from "../src/prediction/temporal-resource-conflict-predictor"

describe("TemporalResourceConflictPredictor", () => {
  it("should detect a conflict when two steps overlap and exceed resource limits", async () => {
    const predictor = new TemporalResourceConflictPredictor()
    const steps: PlanStep[] = [
      {
        id: "step1",
        resourceRequirements: { cpu: 5, memory: 10 },
        durationSeconds: 10,
        startTimeSeconds: 0,
      },
      {
        id: "step2",
        resourceRequirements: { cpu: 8, memory: 5 },
        durationSeconds: 10,
        startTimeSeconds: 5,
      },
    ]
    const conflicts = await predictor.predictConflicts(steps, {
      cpu: 10,
      memory: 20,
    })

    expect(conflicts.length).toBe(1)
    const conflict = conflicts[0]
    expect(conflict.resource).toBe("cpu")
    expect(conflict.timeWindowStart).toBe(5)
    expect(conflict.timeWindowEnd).toBe(15)
    expect(conflict.exceededLimit).toBe(10)
    expect(conflict.actualUsage).toBe(13)
  })

  it("should not detect a conflict when resource usage is within limits", async () => {
    const predictor = new TemporalResourceConflictPredictor()
    const steps: PlanStep[] = [
      {
        id: "step1",
        resourceRequirements: { cpu: 3, memory: 5 },
        durationSeconds: 10,
        startTimeSeconds: 0,
      },
      {
        id: "step2",
        resourceRequirements: { cpu: 4, memory: 10 },
        durationSeconds: 10,
        startTimeSeconds: 15,
      },
    ]
    const conflicts = await predictor.predictConflicts(steps, {
      cpu: 10,
      memory: 20,
    })

    expect(conflicts.length).toBe(0)
  })

  it("should handle non-overlapping steps correctly", async () => {
    const predictor = new TemporalResourceConflictPredictor()
    const steps: PlanStep[] = [
      {
        id: "step1",
        resourceRequirements: { cpu: 2, memory: 1 },
        durationSeconds: 5,
        startTimeSeconds: 0,
      },
      {
        id: "step2",
        resourceRequirements: { cpu: 3, memory: 2 },
        durationSeconds: 5,
        startTimeSeconds: 10,
      },
    ]
    const conflicts = await predictor.predictConflicts(steps, {
      cpu: 10,
      memory: 10,
    })

    expect(conflicts.length).toBe(0)
  })
})