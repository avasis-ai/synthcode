import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV9 } from "../src/visualization/dependency-graph-visualizer-v9";

describe("DependencyGraphVisualizerV9", () => {
  it("should correctly initialize with basic data", () => {
    const visualizer = new DependencyGraphVisualizerV9();
    expect(visualizer).toBeDefined();
  });

  it("should process a simple dependency graph", () => {
    const visualizer = new DependencyGraphVisualizerV9();
    const graphData = {
      nodes: [{ id: "A", name: "Task A" }, { id: "B", name: "Task B" }],
      edges: [{ sourceId: "A", targetId: "B", duration: 5 }],
    };
    visualizer.visualize(graphData);
    // Assuming visualize updates an internal state or returns a structure we can check
    // For this test, we'll just check if the method runs without error and perhaps check a basic property if one were exposed.
    // Since the implementation details aren't fully visible, we'll test the call itself.
    expect(visualizer.getGraphData()).toEqual(graphData); // Mocking getGraphData for testability
  });

  it("should handle complex temporal dependencies", () => {
    const visualizer = new DependencyGraphVisualizerV9();
    const graphData = {
      nodes: [{ id: "Start", name: "Start" }, { id: "Middle", name: "Middle" }],
      edges: [{ sourceId: "Start", targetId: "Middle", duration: 10, resourceConstraints: [{ resourceName: "CPU", requiredAmount: 1, timeWindowStart: 0, timeWindowEnd: 10 }] }],
    };
    visualizer.visualize(graphData);
    // Check if the resource constraint was incorporated (assuming the internal structure reflects this)
    const processedEdges = visualizer.getProcessedEdges(); // Mocking a getter for processed edges
    expect(processedEdges).toHaveLength(1);
    expect(processedEdges[0].resourceConstraints).toBeDefined();
  });
});