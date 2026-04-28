import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizer } from "../src/visualization/contextual-dependency-graph-visualizer-v146";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should initialize correctly with valid inputs", () => {
    const visualizer = new ContextualDependencyGraphVisualizer(
      {
        nodes: [{ id: "A", label: "Node A" }],
        edges: [],
      }
    );
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a simple dependency graph", () => {
    const nodes = [{ id: "A", label: "Start" }, { id: "B", label: "End" }];
    const edges = [{ sourceId: "A", targetId: "B", weight: 1 }];
    const visualizer = new ContextualDependencyGraphVisualizer({ nodes, edges });

    // Assuming there's a method to check the structure or render state
    // For this test, we'll check if the internal structure seems populated
    // A real test would check the output visualization data structure.
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
  });

  it("should handle empty graph data gracefully", () => {
    const visualizer = new ContextualDependencyGraphVisualizer({ nodes: [], edges: [] });
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });
});