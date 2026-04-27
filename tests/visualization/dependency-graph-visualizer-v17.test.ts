import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v17";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizer({});
    expect(visualizer).toBeDefined();
  });

  it("should render nodes and edges when provided with valid data", () => {
    const mockData = {
      nodes: {
        "A": { id: "A", label: "Node A", position: { x: 10, y: 10 } },
        "B": { id: "B", label: "Node B", position: { x: 50, y: 50 } },
      },
      edges: [
        { edgeId: "e1", source: "A", target: "B", weight: 1 },
      ],
    };
    const visualizer = new DependencyGraphVisualizer(mockData);
    // Assuming the visualizer has a method or property to check rendered elements
    // For this test, we'll check if it processes the data structure.
    expect(visualizer).toHaveProperty("graphData");
    expect(visualizer.graphData.nodes["A"]).toBeDefined();
  });

  it("should handle resource constraints when building temporal edges", () => {
    const mockData = {
      nodes: {
        "A": { id: "A", label: "Node A", position: { x: 0, y: 0 } },
        "B": { id: "B", label: "Node B", position: { x: 100, y: 0 } },
      },
      edges: [
        { edgeId: "e1", source: "A", target: "B", weight: 1, resourceConstraints: [{ resourceName: "CPU", requiredCapacity: 1, startTime: 0, endTime: 10 }] },
      ],
    };
    const visualizer = new DependencyGraphVisualizer(mockData);
    // Check if the resource constraint was processed into the internal structure
    const edge = visualizer.getEdgeData("e1");
    expect(edge).toBeDefined();
    expect(edge.resourceConstraints).toHaveLength(1);
  });
});