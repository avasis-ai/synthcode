import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV6 } from "../src/visualization/dependency-graph-visualizer-v6";

describe("DependencyGraphVisualizerV6", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizerV6();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV6();
    visualizer.addNode("A", { label: "Node A" });
    visualizer.addNode("B", { label: "Node B" });
    visualizer.addEdge("A", "B", { type: "depends_on" });

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("A");
    expect(visualizer.edges[0].sourceId).toBe("A");
    expect(visualizer.edges[0].targetId).toBe("B");
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const visualizer = new DependencyGraphVisualizerV6();
    visualizer.addNode("A", { label: "Node A" });
    visualizer.addNode("A", { label: "Different Label" }); // Duplicate node
    visualizer.addEdge("A", "B", { type: "depends_on" });
    visualizer.addEdge("A", "B", { type: "another_type" }); // Duplicate edge (might overwrite or ignore depending on implementation)

    // Assuming the implementation handles duplicates by keeping the first or updating based on logic.
    // For this test, we check if the count doesn't explode.
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.edges).toHaveLength(1);
  });
});