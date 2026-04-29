import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  ConstraintMetadata,
  DependencyEdge,
  NodeData,
} from "../src/visualization/contextual-dependency-graph-visualizer-v159";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ContextualDependencyGraphVisualizer([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly from provided data", () => {
    const nodes: NodeData[] = [
      { id: "A", type: "message", content: "Hello" },
      { id: "B", type: "tool_use", content: "tool_call" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        metadata: { resource: { resourceName: "api", limit: 10 } },
      },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, edges);
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()).toContainEqual(
      expect.objectContaining({ id: "A", type: "message" })
    );
    expect(visualizer.getEdges()[0].sourceId).toBe("A");
  });

  it("should handle updates to nodes and edges", () => {
    const initialNodes: NodeData[] = [{ id: "A", type: "message", content: "Initial" }];
    const initialEdges: DependencyEdge[] = [];
    const visualizer = new ContextualDependencyGraphVisualizer(initialNodes, initialEdges);

    const updatedNodes: NodeData[] = [{ id: "A", type: "message", content: "Updated" }, { id: "C", type: "thinking" }];
    const updatedEdges: DependencyEdge[] = [
      {
        sourceId: "A",
        targetId: "C",
        metadata: {},
      },
    ];

    visualizer.update(updatedNodes, updatedEdges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getNodes()).toContainEqual(
      expect.objectContaining({ id: "C", type: "thinking" })
    );
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()[0].targetId).toBe("C");
  });
});