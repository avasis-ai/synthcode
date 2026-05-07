import { describe, it, expect } from "vitest";
import {
  TemporalResourceConflictPredictor,
  ResourceName,
  PlanStep,
  TemporalResourceConflict,
} from "../src/scheduling/temporal-resource-conflict-predictor";

describe("TemporalResourceConflictPredictor", () => {
  it("should detect a simple resource conflict when two steps overlap and exceed capacity", async () => {
    const predictor = new TemporalResourceConflictPredictor();
    const steps: PlanStep[] = [
      {
        id: "step1",
        startTime: 10,
        endTime: 20,
        resourceUsage: { "CPU": 3 },
      },
      {
        id: "step2",
        startTime: 15,
        endTime: 25,
        resourceUsage: { "CPU": 3 },
      },
    ];

    const conflicts = await predictor.predictConflicts(steps);

    expect(conflicts).toHaveLength(1);
    const conflict = conflicts[0];
    expect(conflict.resource).toBe("CPU");
    expect(conflict.startTime).toBe(15);
    expect(conflict.endTime).toBe(20);
    expect(conflict.severity).toBe("HIGH");
  });

  it("should handle non-conflicting steps correctly", async () => {
    const predictor = new TemporalResourceConflictPredictor();
    const steps: PlanStep[] = [
      {
        id: "step1",
        startTime: 10,
        endTime: 20,
        resourceUsage: { "CPU": 2 },
      },
      {
        id: "step2",
        startTime: 20,
        endTime: 30,
        resourceUsage: { "CPU": 2 },
      },
    ];

    const conflicts = await predictor.predictConflicts(steps);

    expect(conflicts).toHaveLength(0);
  });

  it("should detect a critical conflict when multiple resources are over-utilized simultaneously", async () => {
    const predictor = new TemporalResourceConflictPredictor();
    const steps: PlanStep[] = [
      {
        id: "stepA",
        startTime: 5,
        endTime: 15,
        resourceUsage: { "Memory": 5 },
      },
      {
        id: "stepB",
        startTime: 10,
        endTime: 20,
        resourceUsage: { "Memory": 6 },
      },
      {
        id: "stepC",
        startTime: 12,
        endTime: 18,
        resourceUsage: { "CPU": 5 },
      },
    ];

    const conflicts = await predictor.predictConflicts(steps);

    expect(conflicts).toHaveLength(2);
    // Check for the Memory conflict
    const memoryConflict = conflicts.find(c => c.resource === "Memory");
    expect(memoryConflict).toBeDefined();
    expect(memoryConflict!.severity).toBe("CRITICAL");
    // Check for the CPU conflict
    const cpuConflict = conflicts.find(c => c.resource === "CPU");
    expect(cpuConflict).toBeDefined();
    expect(cpuConflict!.severity).toBe("MEDIUM");
  });
});