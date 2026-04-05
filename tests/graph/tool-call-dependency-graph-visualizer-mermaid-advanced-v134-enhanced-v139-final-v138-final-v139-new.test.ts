import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
  GraphContext,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v138-final-v139-new";

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

  it("should allow adding nodes and edges", () => {
    const context: GraphContext = {
      nodes: [],
      edges: [],
      messages: [],
    };
    const newNode: GraphNode = { id: "n1", label: "Start", type: "start" };
    const newEdge: GraphEdge = { from: "n1", to: "n2", label: "Success" };

    // Assuming there's a method or direct manipulation for testing purposes
    // Since the provided code snippet is an interface definition, we test the structure.
    context.nodes.push(newNode);
    context.edges.push(newEdge);

    expect(context.nodes).toHaveLength(1);
    expect(context.edges).toHaveLength(1);
    expect(context.nodes[0]).toEqual(newNode);
    expect(context.edges[0]).toEqual(newEdge);
  });

  it("should handle complex graph structures", () => {
    const context: GraphContext = {
      nodes: [
        { id: "start", label: "Start", type: "start" },
        { id: "process", label: "Process A", type: "process" },
        { id: "tool_call", label: "Tool Call", type: "tool_call" },
        { id: "end", label: "End", type: "end" },
      ],
      edges: [
        { from: "start", to: "process", label: "Always" },
        { from: "process", to: "tool_call", label: "Needs Tool" },
        { from: "tool_call", to: "end", label: "Done" },
      ],
      messages: [],
    };

    expect(context.nodes).toHaveLength(4);
    expect(context.edges).toHaveLength(2);
    expect(context.nodes.some(n => n.id === "process" && n.type === "process")).toBe(true);
    expect(context.edges.some(e => e.from === "process" && e.to === "tool_call")).toBe(true);
  });
});