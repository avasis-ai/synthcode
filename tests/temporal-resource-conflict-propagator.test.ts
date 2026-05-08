import { describe, it, expect } from "vitest";
import { ConflictPropagator } from "./temporal-resource-conflict-propagator";

describe("ConflictPropagator", () => {
  it("should correctly identify a simple resource conflict", () => {
    const propagator = new ConflictPropagator();
    const steps = [
      { id: "stepA", resourceRequirements: [{ resourceName: "CPU", quantity: 1 }], duration: 10, earliestStart: 0 },
      { id: "stepB", resourceRequirements: [{ resourceName: "CPU", quantity: 1 }], duration: 10, earliestStart: 5 },
    ];
    const conflicts = propagator.findConflicts(steps);

    expect(conflicts).toHaveLength(1);
    const conflict = conflicts[0];
    expect(conflict.resourceName).toBe("CPU");
    expect(conflict.overlapStart).toBe(5);
    expect(conflict.overlapEnd).toBe(15);
    expect(conflict.conflictingSteps).toHaveLength(2);
    expect(conflict.conflictingSteps).toEqual(
      expect.arrayContaining([
        { stepId: "stepA", plannedStart: 0, plannedEnd: 10 },
        { stepId: "stepB", plannedStart: 5, plannedEnd: 15 },
      ])
    );
  });

  it("should handle multiple resources and non-conflicting steps", () => {
    const propagator = new ConflictPropagator();
    const steps = [
      { id: "step1", resourceRequirements: [{ resourceName: "CPU", quantity: 1 }], duration: 10, earliestStart: 0 },
      { id: "step2", resourceRequirements: [{ resourceName: "Memory", quantity: 2 }], duration: 5, earliestStart: 15 },
      { id: "step3", resourceRequirements: [{ resourceName: "CPU", quantity: 1 }], duration: 5, earliestStart: 20 },
    ];
    const conflicts = propagator.findConflicts(steps);

    expect(conflicts).toHaveLength(0);
  });

  it("should detect conflicts involving different resource quantities", () => {
    const propagator = new ConflictPropagator();
    const steps = [
      { id: "stepX", resourceRequirements: [{ resourceName: "GPU", quantity: 2 }], duration: 10, earliestStart: 0 },
      { id: "stepY", resourceRequirements: [{ resourceName: "GPU", quantity: 1 }], duration: 10, earliestStart: 5 },
    ];
    const conflicts = propagator.findConflicts(steps);

    expect(conflicts).toHaveLength(1);
    const conflict = conflicts[0];
    expect(conflict.resourceName).toBe("GPU");
    expect(conflict.overlapStart).toBe(5);
    expect(conflict.overlapEnd).toBe(15);
    expect(conflict.conflictingSteps).toHaveLength(2);
  });
});