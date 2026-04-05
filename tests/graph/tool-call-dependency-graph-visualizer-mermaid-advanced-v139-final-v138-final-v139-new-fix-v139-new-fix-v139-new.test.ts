import { describe, it, expect } from "vitest";
import {
  DependencyGraph,
  GraphNode,
  FlowControlType,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new";

describe("DependencyGraph", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: GraphNode[] = [
      { id: "user1", type: "user", content: [{ type: "text", content: "Hello" }] }],
      { id: "assistant1", type: "assistant", content: [{ type: "text", content: "Hi there" }] },
    ];
    const edges = [{ from: "user1", to: "assistant1" }];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].id).toBe("user1");
    expect(graph.edges[0].from).toBe("user1");
  });

  it("should handle nodes with flow control details", () => {
    const nodes: GraphNode[] = [
      {
        id: "decision",
        type: "assistant",
        content: [],
        flowControl: {
          type: "conditional",
          details: {
            condition: "success",
            next_if_true: "success_path",
            next_if_false: "failure_path",
          },
        },
      },
    ];
    const graph: DependencyGraph = { nodes, edges: [] };

    expect(graph.nodes[0].flowControl).toBeDefined();
    expect(graph.nodes[0].flowControl!.type).toBe("conditional");
    expect(graph.nodes[0].flowControl!.details).toEqual({
      condition: "success",
      next_if_true: "success_path",
      next_if_false: "failure_path",
    });
  });

  it("should correctly represent a sequential flow graph", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "user", content: [] },
      { id: "step1", type: "assistant", content: [] },
      { id: "step2", type: "tool", content: [] },
    ];
    const edges = [
      { from: "start", to: "step1" },
      { from: "step1", to: "step2" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].from).toBe("start");
    expect(graph.edges[1].to).toBe("step2");
  });
});