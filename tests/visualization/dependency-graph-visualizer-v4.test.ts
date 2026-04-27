import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV4,
  DependencyNode,
  TemporalConstraint,
} from "../src/visualization/dependency-graph-visualizer-v4";

describe("DependencyGraphVisualizerV4", () => {
  it("should initialize correctly with empty inputs", () => {
    const visualizer = new DependencyGraphVisualizerV4([]);
    expect(visualizer).toBeDefined();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.constraints).toEqual([]);
  });

  it("should correctly process a set of nodes and constraints", () => {
    const nodes: DependencyNode[] = [
      { id: "A", label: "Start", type: "user_input", metadata: {} },
      { id: "B", label: "Process", type: "tool", metadata: {} },
    ];
    const constraints: TemporalConstraint[] = [
      { fromNodeId: "A", toNodeId: "B", constraintType: "must_precede" },
    ];
    const visualizer = new DependencyGraphVisualizerV4(nodes, constraints);
    expect(visualizer.nodes).toEqual(nodes);
    expect(visualizer.constraints).toEqual(constraints);
  });

  it("should handle an empty set of nodes and constraints gracefully", () => {
    const visualizer = new DependencyGraphVisualizerV4([], []);
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.constraints).toEqual([]);
  });
});