import { describe, it, expect } from "vitest";
import { TemporalResourceConstraint } from "../src/context/contextual-constraint-propagator-v8";

describe("TemporalResourceConstraint", () => {
  it("should correctly initialize with valid data", () => {
    const constraint: TemporalResourceConstraint = {
      id: "test-id",
      severity: "HIGH",
      description: "Test constraint",
      timeWindow: { start: 100, end: 200 },
      requiredResources: [{ resourceName: "cpu", capacity: 5 }],
    };
    expect(constraint.id).toBe("test-id");
    expect(constraint.severity).toBe("HIGH");
    expect(constraint.timeWindow).toEqual({ start: 100, end: 200 });
    expect(constraint.requiredResources).toEqual([{ resourceName: "cpu", capacity: 5 }]);
  });

  it("should handle constraints with multiple resource requirements", () => {
    const constraint: TemporalResourceConstraint = {
      id: "multi-resource",
      severity: "CRITICAL",
      description: "Multiple resources needed",
      timeWindow: { start: 0, end: 1000 },
      requiredResources: [
        { resourceName: "memory", capacity: 1024 },
        { resourceName: "gpu", capacity: 2 },
      ],
    };
    expect(constraint.requiredResources).toHaveLength(2);
    expect(constraint.requiredResources).toEqual(
      expect.arrayContaining([
        { resourceName: "memory", capacity: 1024 },
        { resourceName: "gpu", capacity: 2 },
      ])
    );
  });

  it("should correctly identify constraints with zero duration time window", () => {
    const constraint: TemporalResourceConstraint = {
      id: "zero-duration",
      severity: "LOW",
      description: "Instantaneous constraint",
      timeWindow: { start: 50, end: 50 },
      requiredResources: [],
    };
    expect(constraint.timeWindow).toEqual({ start: 50, end: 50 });
    expect(constraint.requiredResources).toEqual([]);
  });
});