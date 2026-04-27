import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v18";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizer();
    const nodes = [
      { id: "A", label: "Node A", data: {} },
      { id: "B", label: "Node B", data: {} },
    ];
    const edges = [
      { sourceId: "A", targetId: "B", type: "dependency", constraints: [] },
    ];
    visualizer.addNodes(nodes);
    visualizer.addEdges(edges);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("A");
    expect(visualizer.edges[0].sourceId).toBe("A");
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const visualizer = new DependencyGraphVisualizer();
    const initialNodes = [{ id: "A", label: "A", data: {} }];
    const initialEdges = [{ sourceId: "A", targetId: "B", type: "dependency", constraints: [] }];

    visualizer.addNodes(initialNodes);
    visualizer.addEdges(initialEdges);

    // Attempt to add duplicates
    visualizer.addNodes([{ id: "A", label: "A", data: {} }]);
    visualizer.addEdges([{ sourceId: "A", targetId: "B", type: "dependency", constraints: [] }]);

    // Check that the count remains the same (no duplicates added)
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.edges).toHaveLength(1);
  });
});