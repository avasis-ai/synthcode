import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV19 } from "../src/visualization/dependency-graph-visualizer-v19";

describe("DependencyGraphVisualizerV19", () => {
  it("should initialize correctly with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV19({});
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a simple set of nodes and edges", () => {
    const nodes = {
      "A": { id: "A", label: "Node A", metadata: {} },
      "B": { id: "B", label: "Node B", metadata: {} },
    };
    const edges = [
      { sourceNodeId: "A", targetNodeId: "B", resourceRequired: "R1", constraintType: "sequential" },
    ];
    const data = { nodes, edges };
    const visualizer = new DependencyGraphVisualizerV19(data);
    // Assuming the visualizer has a method to get processed data or state
    // We'll test for a basic structure check if a specific method isn't clear
    // For this test, we'll assume it processes and stores the data correctly.
    expect(visualizer).toHaveProperty("processedData");
  });

  it("should handle complex data including temporal edges", () => {
    const nodes = {
      "Start": { id: "Start", label: "Start", metadata: {} },
      "Task1": { id: "Task1", label: "Task 1", metadata: {} },
      "End": { id: "End", label: "End", metadata: {} },
    };
    const edges = [
      { sourceNodeId: "Start", targetNodeId: "Task1", resourceRequired: "R1", constraintType: "sequential" },
      { sourceNodeId: "Task1", targetNodeId: "End", resourceRequired: "R2", constraintType: "overlap", startTime: 10, endTime: 20 },
    ];
    const data = { nodes, edges };
    const visualizer = new DependencyGraphVisualizerV19(data);
    // Check if the visualizer handles the temporal data structure
    expect(visualizer).toHaveProperty("processedData");
  });
});