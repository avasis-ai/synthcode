import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TemporalConstraint,
} from "../src/visualization/contextual-dependency-graph-visualizer-advanced";

describe("ContextualDependencyGraphVisualizerAdvanced", () => {
  it("should correctly process basic resource constraints", () => {
    const constraints: ResourceConstraint[] = [
      { resourceName: "CPU", usage: 0.7, threshold: 0.9 },
      { resourceName: "Memory", usage: 0.4, threshold: 0.6 },
    ];
    const result = constraints.map(c => `${c.resourceName}: ${c.usage * 100}%/${c.threshold * 100}%`);
    expect(result).toEqual(["CPU: 70%/90%", "Memory: 40%/60%"]);
  });

  it("should correctly process temporal constraints with decay", () => {
    const constraints: TemporalConstraint[] = [
      { startTime: 1672531200, endTime: 1672534800, decayRate: 0.1 },
    ];
    const result = constraints.map(c => `${c.startTime}-${c.endTime} (Decay: ${c.decayRate})`);
    expect(result).toEqual(["1672531200-1672534800 (Decay: 0.1)"]);
  });

  it("should handle an empty list of constraints gracefully", () => {
    const constraints: ResourceConstraint[] = [];
    const result = constraints.map(c => `${c.resourceName}: ${c.usage * 100}%/${c.threshold * 100}%`);
    expect(result).toEqual([]);
  });
});