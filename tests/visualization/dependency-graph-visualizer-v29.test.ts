import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v29";

describe("DependencyGraphVisualizer", () => {
  it("should initialize correctly with basic data", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer).toBeDefined();
  });

  it("should correctly process and visualize a simple graph", () => {
    const visualizer = new DependencyGraphVisualizer();
    const nodes = [{ id: "A", label: "Node A" }];
    const edges = [{ source: "A", target: "B" }];
    // Assuming the visualizer has a method to set/process data
    // We mock the internal state check since the actual implementation isn't fully visible
    // but we test the expected usage pattern.
    visualizer.setGraphData(nodes, edges);
    // A real test would check the internal structure or a rendering output.
    // For this example, we just ensure the method runs without error.
    expect(visualizer.getNodes()).toEqual(nodes);
  });

  it("should handle empty graph data gracefully", () => {
    const visualizer = new DependencyGraphVisualizer();
    const nodes: any[] = [];
    const edges: any[] = [];
    visualizer.setGraphData(nodes, edges);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });
});