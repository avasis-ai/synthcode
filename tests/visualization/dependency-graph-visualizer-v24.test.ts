import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV24 } from "../src/visualization/dependency-graph-visualizer-v24";

describe("DependencyGraphVisualizerV24", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV24();
    expect(visualizer).toBeInstanceOf(DependencyGraphVisualizerV24);
    // Assuming there's a way to check initial state, e.g., empty nodes/edges
  });

  it("should process and add nodes from a given list", () => {
    const visualizer = new DependencyGraphVisualizerV24();
    const nodes = [
      { id: "A", label: "Node A", metadata: {}, resourceCapacity: {} },
      { id: "B", label: "Node B", metadata: {}, resourceCapacity: {} },
    ];
    visualizer.addNodes(nodes);
    // Assuming a method or property to check added nodes count/content
    expect(visualizer.getNodes().length).toBe(2);
  });

  it("should process and add edges between existing nodes", () => {
    const visualizer = new DependencyGraphVisualizerV24();
    const nodes = [
      { id: "A", label: "Node A", metadata: {}, resourceCapacity: {} },
      { id: "B", label: "Node B", metadata: {}, resourceCapacity: {} },
    ];
    visualizer.addNodes(nodes);

    const edges = [
      { sourceId: "A", targetId: "B", data: { startTime: 0, endTime: 10, resourceUsage: { cpu: 1 } } },
    ];
    visualizer.addEdge(edges[0]);
    // Assuming a method or property to check added edges count/content
    expect(visualizer.getEdges().length).toBe(1);
  });
});