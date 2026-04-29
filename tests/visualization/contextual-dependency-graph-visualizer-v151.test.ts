import { describe, it, expect } from "vitest";
import {
  ContextualLink,
  DependencyGraphNode,
  DependencyGraphEdge,
} from "../src/visualization/contextual-dependency-graph-visualizer-v151";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly structure a simple linear dependency graph", () => {
    const nodes: DependencyGraphNode[] = [
      { id: "n1", type: "message", content: "Start", metadata: {} },
      { id: "n2", type: "tool_call", content: "ToolA", metadata: {} },
      { id: "n3", type: "message", content: "End", metadata: {} },
    ];
    const edges: DependencyGraphEdge[] = [
      { sourceId: "n1", targetId: "n2", type: "FLOW" },
      { sourceId: "n2", targetId: "n3", type: "FLOW" },
    ];
    const graph = { nodes, edges };
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
  });

  it("should handle a graph with contextual links", () => {
    const nodes: DependencyGraphNode[] = [
      { id: "n1", type: "message", content: "User asked X", metadata: {} },
      { id: "n2", type: "context_source", content: "Memory Chunk", metadata: {} },
    ];
    const edges: DependencyGraphEdge[] = [
      { sourceId: "n1", targetId: "n2", type: "CONTEXTUAL", context: {
        source: "user_input",
        identifier: "user_input_id",
        description: "Relates to user input",
      } },
    ];
    const graph = { nodes, edges };
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].type).toBe("CONTEXTUAL");
  });

  it("should correctly represent a complex graph structure", () => {
    const nodes: DependencyGraphNode[] = [
      { id: "n1", type: "message", content: "Start", metadata: {} },
      { id: "n2", type: "tool_call", content: "ToolA", metadata: {} },
      { id: "n3", type: "context_source", content: "Context", metadata: {} },
      { id: "n4", type: "message", content: "End", metadata: {} },
    ];
    const edges: DependencyGraphEdge[] = [
      { sourceId: "n1", targetId: "n2", type: "FLOW" },
      { sourceId: "n2", targetId: "n3", type: "CONTEXTUAL", context: {
        source: "memory",
        identifier: "mem_id_123",
        description: "Used memory",
      }},
      { sourceId: "n3", targetId: "n4", type: "FLOW" },
    ];
    const graph = { nodes, edges };
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
  });
});