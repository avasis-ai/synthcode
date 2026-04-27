import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV8 } from "../src/visualization/dependency-graph-visualizer-v8";

describe("DependencyGraphVisualizerV8", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizerV8();
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV8();
    visualizer.addNode("nodeA", { label: "A" });
    visualizer.addNode("nodeB", { label: "B" });
    visualizer.addEdge("nodeA", "nodeB", { type: "depends_on" });

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes().find(n => n.id === "nodeA")?.label).toBe("A");
    expect(visualizer.getEdges().find(e => e.source === "nodeA" && e.target === "nodeB")?.type).toBe("depends_on");
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const visualizer = new DependencyGraphVisualizerV8();
    visualizer.addNode("nodeX", { label: "X" });
    visualizer.addNode("nodeX", { label: "Y" }); // Attempt to add duplicate node
    visualizer.addEdge("nodeX", "nodeY", { type: "depends_on" });
    visualizer.addEdge("nodeX", "nodeY", { type: "other" }); // Attempt to add duplicate edge

    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getNodes().find(n => n.id === "nodeX")?.label).toBe("X"); // Should keep the first definition or handle it
    expect(visualizer.getEdges()).toHaveLength(1); // Should only keep one edge definition
  });
});