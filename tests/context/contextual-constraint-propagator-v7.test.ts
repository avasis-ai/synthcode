import { describe, it, expect } from "vitest";
import { Constraint } from "../src/context/contextual-constraint-propagator-v7";

describe("Constraint", () => {
  it("should correctly merge temporal and resource constraints", () => {
    const constraint: Constraint = {
      temporal: { startTime: 100, endTime: 200, duration: 100 },
      resource: { resourceId: "cpu", requiredAmount: 5, availableAmount: 10 },
    };
    expect(constraint).toBeDefined();
    expect(constraint?.temporal).toEqual({ startTime: 100, endTime: 200, duration: 100 });
    expect(constraint?.resource).toEqual({ resourceId: "cpu", requiredAmount: 5, availableAmount: 10 });
  });

  it("should handle only capability constraints", () => {
    const constraint: Constraint = {
      capability: "write",
      level: "write",
    };
    expect(constraint).toBeDefined();
    expect(constraint?.capability).toBe("write");
    expect(constraint?.level).toBe("write");
  });

  it("should allow for mixed and partial constraints", () => {
    const constraint: Constraint = {
      temporal: { startTime: 0, endTime: 50, duration: 50 },
      resource: { resourceId: "memory", requiredAmount: 1, availableAmount: 4 },
    };
    expect(constraint).toBeDefined();
    expect(constraint?.temporal).toBeDefined();
    expect(constraint?.resource).toBeDefined();
  });
});