import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV15 } from "../src/visualization/dependency-graph-visualizer-v15";

describe("DependencyGraphVisualizerV15", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV15();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV15();
    const nodes = [
      { id: "A", label: "Node A", metadata: {} },
      { id: "B", label: "Node B", metadata: {} },
    ];
    const edges = [
      { sourceId: "A", targetId: "B", metadata: {} },
    ];
    visualizer.addNodes(nodes);
    visualizer.addEdge(edges[0]);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("A");
    expect(visualizer.edges[0].sourceId).toBe("A");
  });

  it("should handle updates to existing nodes and edges", () => {
    const visualizer = new DependencyGraphVisualizerV15();
    const initialNodes = [{ id: "A", label: "A", metadata: {} }];
    const initialEdges = [{ sourceId: "A", targetId: "B", metadata: {} }];
    visualizer.addNodes(initialNodes);
    visualizer.addEdge(initialEdges);

    const updatedNodes = [{ id: "A", label: "Updated A", metadata: {} }];
    const updatedEdge = { sourceId: "A", targetId: "B", metadata: { conflict: "temporal" } };

    visualizer.updateNode("A", updatedNodes[0]);
    visualizer.updateEdge(updatedEdge);

    expect(visualizer.nodes.find(n => n.id === "A")?.label).toBe("Updated A");
    expect(visualizer.edges.find(e => e.sourceId === "A" && e.targetId === "B")?.metadata.conflict).toBe("temporal");
  });
});