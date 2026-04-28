import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  DependencyNode,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/contextual-dependency-graph-visualizer-v141";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should initialize correctly with basic nodes and constraints", () => {
    const nodes: DependencyNode[] = [
      { id: "A", label: "Node A", metadata: { temporal: { startTimeMs: 0, endTimeMs: 100 } } },
      { id: "B", label: "Node B", metadata: { temporal: { startTimeMs: 50, endTimeMs: 150 } } },
    ];
    const constraints: ResourceConstraint[] = [
      { resourceName: "CPU", minUsage: 1, maxUsage: 5 },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, constraints);
    expect(visualizer).toBeDefined();
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getConstraints()).toHaveLength(1);
  });

  it("should correctly calculate dependencies between overlapping nodes", () => {
    const nodes: DependencyNode[] = [
      { id: "Start", label: "Start", metadata: { temporal: { startTimeMs: 0, endTimeMs: 100 } } },
      { id: "Middle", label: "Middle", metadata: { temporal: { startTimeMs: 50, endTimeMs: 150 } } },
      { id: "End", label: "End", metadata: { temporal: { startTimeMs: 120, endTimeMs: 200 } } },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, []);
    const dependencies = visualizer.getDependencies();
    expect(dependencies).toHaveLength(2);
    expect(dependencies).toContainEqual({ sourceId: "Start", targetId: "Middle" });
    expect(dependencies).toContainEqual({ sourceId: "Middle", targetId: "End" });
  });

  it("should handle empty inputs gracefully", () => {
    const visualizer = new ContextualDependencyGraphVisualizer([], []);
    expect(visualizer.getNodes()).toHaveLength(0);
    expect(visualizer.getDependencies()).toHaveLength(0);
  });
});