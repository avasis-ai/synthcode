import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV27 } from "../src/visualization/dependency-graph-visualizer-v27";

describe("DependencyGraphVisualizerV27", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV27();
    expect(visualizer.graphData).toEqual({
      nodes: [],
      edges: [],
    });
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV27();
    const nodes = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges = [
      { source: "A", target: "B", weight: 1 },
    ];
    visualizer.addNodes(nodes);
    visualizer.addEdge(edges[0]);

    expect(visualizer.graphData.nodes).toHaveLength(2);
    expect(visualizer.graphData.edges).toHaveLength(1);
    expect(visualizer.graphData.nodes).toContainEqual(expect.objectContaining({ id: "A" }));
    expect(visualizer.graphData.edges).toContainEqual(expect.objectContaining({ source: "A", target: "B", weight: 1 }));
  });

  it("should update graph data when adding more nodes and edges", () => {
    const visualizer = new DependencyGraphVisualizerV27();
    visualizer.addNodes([{ id: "A", label: "A" }]);
    visualizer.addEdge({ source: "A", target: "B", weight: 1 });

    const newNodes = [{ id: "C", label: "C" }];
    const newEdges = [{ source: "A", target: "C", weight: 2 }];

    visualizer.addNodes(newNodes);
    visualizer.addEdge(newEdges[0]);

    expect(visualizer.graphData.nodes).toHaveLength(2);
    expect(visualizer.graphData.edges).toHaveLength(2);
    expect(visualizer.graphData.nodes).toContainEqual(expect.objectContaining({ id: "C" }));
    expect(visualizer.graphData.edges).toContainEqual(expect.objectContaining({ source: "A", target: "C", weight: 2 }));
  });
});