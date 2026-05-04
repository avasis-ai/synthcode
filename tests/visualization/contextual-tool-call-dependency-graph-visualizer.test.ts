import { describe, it, expect } from "vitest";
import { ContextualToolCallDependencyGraphVisualizer } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer";

describe("ContextualToolCallDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty graph data", () => {
    const visualizer = new ContextualToolCallDependencyGraphVisualizer({});
    expect(visualizer.getGraph()).toEqual({ nodes: {}, edges: [] });
  });

  it("should add nodes and edges correctly from a provided graph structure", () => {
    const mockGraph: { nodes: Record<string, { name: string; description: string }>; edges: any[] } = {
      nodes: {
        "node1": { name: "Tool A", description: "Desc A" },
        "node2": { name: "Tool B", description: "Desc B" },
      },
      edges: [
        { callerId: "node1", calleeId: "node2", dependencyType: "output_to_input", sourceKey: "key1", targetKey: "key2" },
      ],
    };
    const visualizer = new ContextualToolCallDependencyGraphVisualizer(mockGraph);
    const graph = visualizer.getGraph();
    expect(graph.nodes).toEqual(mockGraph.nodes);
    expect(graph.edges).toEqual(mockGraph.edges);
  });

  it("should handle an empty graph structure gracefully", () => {
    const visualizer = new ContextualToolCallDependencyGraphVisualizer({ nodes: {}, edges: [] });
    const graph = visualizer.getGraph();
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual([]);
  });
});