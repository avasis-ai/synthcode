import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v37";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizer();
    const node1 = { id: "A", label: "Node A" };
    const node2 = { id: "B", label: "Node B" };
    const edge = { sourceId: "A", targetId: "B", weight: 0.5 };

    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()).toContainEqual(node1);
    expect(visualizer.getEdges()).toContainEqual(edge);
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const visualizer = new DependencyGraphVisualizer();
    const node = { id: "C", label: "Node C" };
    const edge = { sourceId: "C", targetId: "C", weight: 1.0 };

    visualizer.addNode(node);
    visualizer.addNode(node); // Duplicate
    visualizer.addEdge(edge);
    visualizer.addEdge(edge); // Duplicate

    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getEdges()).toHaveLength(1);
  });
});