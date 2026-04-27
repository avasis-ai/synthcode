import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV11 } from "../src/visualization/dependency-graph-visualizer-v11";

describe("DependencyGraphVisualizerV11", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV11([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should process basic component nodes and edges", () => {
    const nodes = [
      { id: "A", name: "Component A", description: "Desc A" },
      { id: "B", name: "Component B", description: "Desc B" },
    ];
    const edges = [
      { source: "A", target: "B", startTime: 10, endTime: 20, resourceConstraint: "R1" },
    ];
    const visualizer = new DependencyGraphVisualizerV11({ components: nodes, temporalEdges: edges });

    const nodesResult = visualizer.getNodes();
    expect(nodesResult).toHaveLength(2);
    expect(nodesResult).toContainEqual({ id: "A", name: "Component A", description: "Desc A" });

    const edgesResult = visualizer.getEdges();
    expect(edgesResult).toHaveLength(1);
    expect(edgesResult[0]).toEqual({
      source: "A",
      target: "B",
      startTime: 10,
      endTime: 20,
      resourceConstraint: "R1",
    });
  });

  it("should handle multiple components and edges correctly", () => {
    const nodes = [
      { id: "C1", name: "Comp 1", description: "D1" },
      { id: "C2", name: "Comp 2", description: "D2" },
      { id: "C3", name: "Comp 3", description: "D3" },
    ];
    const edges = [
      { source: "C1", target: "C2", startTime: 0, endTime: 5, resourceConstraint: "R_A" },
      { source: "C2", target: "C3", startTime: 5, endTime: 10, resourceConstraint: "R_B" },
    ];
    const visualizer = new DependencyGraphVisualizerV11({ components: nodes, temporalEdges: edges });

    expect(visualizer.getNodes()).toHaveLength(3);
    expect(visualizer.getEdges()).toHaveLength(2);
  });
});