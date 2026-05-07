import { describe, it, expect } from "vitest";
import { TemporalScheduler, PlanStep } from "../src/planning/temporal-scheduler";

describe("TemporalScheduler", () => {
  it("should calculate the total duration and resource cost for a set of steps", () => {
    const steps: PlanStep[] = [
      {
        id: "step1",
        name: "Step One",
        description: "First step",
        estimatedDurationSeconds: 10,
        resourceCost: 5,
        requiredResources: { cpu: 1, memory: 2 },
        utilityScore: 0.9,
      },
      {
        id: "step2",
        name: "Step Two",
        description: "Second step",
        estimatedDurationSeconds: 20,
        resourceCost: 10,
        requiredResources: { cpu: 2, memory: 1 },
        utilityScore: 0.8,
      },
    ];
    const scheduler = new TemporalScheduler();
    const result = scheduler.calculateMetrics(steps);

    expect(result.totalDurationSeconds).toBe(30);
    expect(result.totalResourceCost).toBe(15);
    expect(result.maxCpuRequirement).toBe(2);
    expect(result.maxMemoryRequirement).toBe(2);
  });

  it("should handle an empty list of steps gracefully", () => {
    const steps: PlanStep[] = [];
    const scheduler = new TemporalScheduler();
    const result = scheduler.calculateMetrics(steps);

    expect(result.totalDurationSeconds).toBe(0);
    expect(result.totalResourceCost).toBe(0);
    expect(result.maxCpuRequirement).toBe(0);
    expect(result.maxMemoryRequirement).toBe(0);
  });

  it("should correctly calculate metrics when resource requirements vary", () => {
    const steps: PlanStep[] = [
      {
        id: "stepA",
        name: "Step A",
        description: "A step",
        estimatedDurationSeconds: 5,
        resourceCost: 1,
        requiredResources: { gpu: 1, cpu: 1 },
        utilityScore: 0.5,
      },
      {
        id: "stepB",
        name: "Step B",
        description: "B step",
        estimatedDurationSeconds: 15,
        resourceCost: 5,
        requiredResources: { gpu: 2, cpu: 3 },
        utilityScore: 0.9,
      },
    ];
    const scheduler = new TemporalScheduler();
    const result = scheduler.calculateMetrics(steps);

    expect(result.totalDurationSeconds).toBe(20);
    expect(result.totalResourceCost).toBe(6);
    expect(result.maxCpuRequirement).toBe(3);
    expect(result.maxGpuRequirement).toBe(2);
  });
});