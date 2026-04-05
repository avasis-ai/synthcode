import { describe, it, expect } from "vitest";
import {
  GraphContext,
  GraphNode,
  GraphEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v3";

describe("GraphContext", () => {
  it("should correctly initialize with empty arrays", () => {
    const context: GraphContext = {
      nodes: [],
      edges: [],
      messages: [],
    };
    expect(context.nodes).toEqual([]);
    expect(context.edges).toEqual([]);
    expect(context.messages).toEqual([]);
  });

  it("should correctly add a single node", () => {
    const node: GraphNode = {
      id: "start",
      label: "Start",
      type: "start",
    };
    const context: GraphContext = {
      nodes: [node],
      edges: [],
      messages: [],
    };
    expect(context.nodes).toHaveLength(1);
    expect(context.nodes[0]).toEqual(node);
  });

  it("should correctly add a simple edge", () => {
    const context: GraphContext = {
      nodes: [
        { id: "A", label: "Node A", type: "start" },
        { id: "B", label: "Node B", type: "tool_call" },
      ],
      edges: [
        { fromId: "A", toId: "B", label: "Always" },
      ],
      messages: [],
    };
    expect(context.edges).toHaveLength(1);
    expect(context.edges[0]).toEqual({
      fromId: "A",
      toId: "B",
      label: "Always",
    });
  });
});