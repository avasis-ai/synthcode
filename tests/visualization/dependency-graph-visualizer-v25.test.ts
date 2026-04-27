import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v25";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizer();
    const node1 = { id: "A", label: "Start" };
    const node2 = { id: "B", label: "Process" };
    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge({ sourceId: "A", targetId: "B", metadata: { timeWindow: [0, 10] } });

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()).toContainEqual(node1);
    expect(visualizer.getEdges()[0].sourceId).toBe("A");
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const visualizer = new DependencyGraphVisualizer();
    const node = { id: "C", label: "Test" };
    visualizer.addNode(node);
    visualizer.addEdge({ sourceId: "C", targetId: "C", metadata: {} });

    // Assuming the implementation prevents duplicates or handles them idempotently
    // We check that the count doesn't increase unexpectedly
    visualizer.addNode(node);
    visualizer.addEdge({ sourceId: "C", targetId: "C", metadata: {} });

    // Depending on the internal implementation, this might assert length remains 1
    // For this test, we assume adding duplicates doesn't change the structure size.
    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getEdges()).toHaveLength(1);
  });
});