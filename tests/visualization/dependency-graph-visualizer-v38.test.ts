import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v38";
import { GraphData } from "../src/visualization/graph-data-types";

describe("DependencyGraphVisualizer", () => {
  it("should initialize correctly with valid graph data", () => {
    const mockGraphData: GraphData = {
      nodes: [{ id: "A", label: "Node A" }],
      edges: [{ source: "A", target: "B" }],
    };
    const visualizer = new DependencyGraphVisualizer(mockGraphData);
    expect(visualizer).toBeDefined();
  });

  it("should handle empty graph data gracefully", () => {
    const mockGraphData: GraphData = {
      nodes: [],
      edges: [],
    };
    const visualizer = new DependencyGraphVisualizer(mockGraphData);
    // Assuming the visualizer has a method to check if it's empty or renders nothing
    // For this test, we just check if it doesn't throw an error.
    expect(() => visualizer.render()).not.toThrow();
  });

  it("should correctly process nodes and edges for visualization", () => {
    const mockGraphData: GraphData = {
      nodes: [
        { id: "A", label: "Start" },
        { id: "B", label: "End" },
      ],
      edges: [
        { source: "A", target: "B" },
      ],
    };
    const visualizer = new DependencyGraphVisualizer(mockGraphData);
    // Mocking a method call that would use the data
    const renderOutput = visualizer.getVisualizationData();
    expect(renderOutput.nodes).toHaveLength(2);
    expect(renderOutput.edges).toHaveLength(1);
  });
});