import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/tool-execution-dependency-graph-visualizer-v105";

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
    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(node1.id, node2.id, "sequential");

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()[0].sourceId).toBe("A");
    expect(visualizer.getEdges()[0].targetId).toBe("B");
  });

  it("should handle multiple dependencies of different types", () => {
    const visualizer = new DependencyGraphVisualizer();
    const nodeA = { id: "A", label: "Start" };
    const nodeB = { id: "B", label: "Parallel Task" };
    const nodeC = { id: "C", label: "Conditional Task" };
    visualizer.addNode(nodeA);
    visualizer.addNode(nodeB);
    visualizer.addNode(nodeC);

    visualizer.addEdge("A", "B", "parallel");
    visualizer.addEdge("A", "C", "conditional");
    visualizer.addEdge("B", "C", "sequential");

    const edges = visualizer.getEdges();
    expect(edges).toHaveLength(3);
    expect(edges.some(e => e.dependencyType === "parallel")).toBe(true);
    expect(edges.some(e => e.dependencyType === "conditional")).toBe(true);
    expect(edges.some(e => e.dependencyType === "sequential")).toBe(true);
  });
});