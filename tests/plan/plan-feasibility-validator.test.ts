import { describe, it, expect } from "vitest";
import { PlanFeasibilityValidator } from "../src/plan/plan-feasibility-validator";
import { PlanStep, Resource } from "../src/plan/types";

describe("PlanFeasibilityValidator", () => {
  it("should correctly identify resource conflicts in a plan", () => {
    const availableResources: Record<string, Resource> = {
      "Worker": { capacity: 10, unit: "person" },
      "MachineA": { capacity: 2, unit: "unit" },
    };

    const plan: PlanStep[] = [
      { stepId: 1, duration: 2, requiredResources: [{ name: "Worker", quantity: 5 }, { name: "MachineA", quantity: 1 }] },
      { stepId: 2, duration: 3, requiredResources: [{ name: "Worker", quantity: 6 }, { name: "MachineA", quantity: 2 }] },
    ];

    const validator = new PlanFeasibilityValidator(availableResources);
    const result = validator.checkResourceConflicts(plan);

    expect(result.isFeasible).toBe(false);
    expect(result.conflicts).toContain("Worker capacity exceeded at step 2");
    expect(result.conflicts).toContain("MachineA capacity exceeded at step 2");
  });

  it("should report no conflicts if the plan is feasible", () => {
    const availableResources: Record<string, Resource> = {
      "Worker": { capacity: 10, unit: "person" },
      "MachineA": { capacity: 5, unit: "unit" },
    };

    const plan: PlanStep[] = [
      { stepId: 1, duration: 2, requiredResources: [{ name: "Worker", quantity: 3 }, { name: "MachineA", quantity: 1 }] },
      { stepId: 2, duration: 3, requiredResources: [{ name: "Worker", quantity: 5 }, { name: "MachineA", quantity: 3 }] },
    ];

    const validator = new PlanFeasibilityValidator(availableResources);
    const result = validator.checkResourceConflicts(plan);

    expect(result.isFeasible).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it("should handle plans with no steps", () => {
    const availableResources: Record<string, Resource> = {
      "Worker": { capacity: 10, unit: "person" },
    };

    const plan: PlanStep[] = [];

    const validator = new PlanFeasibilityValidator(availableResources);
    const result = validator.checkResourceConflicts(plan);

    expect(result.isFeasible).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });
});