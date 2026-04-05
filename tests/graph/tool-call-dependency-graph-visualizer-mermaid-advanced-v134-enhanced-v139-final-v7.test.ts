import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v7";

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with empty data", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {},
      edges: [],
    };
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add a node with a tool_call type", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {
        "node1": { label: "Tool A Call", type: "tool_call", details: {} },
      },
      edges: [],
    };
    expect(graph.nodes["node1"]).toBeDefined();
    expect(graph.nodes["node1"]!.type).toBe("tool_call");
  });

  it("should correctly add an edge between two nodes", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {
        "start": { label: "Start", type: "message", details: {} },
        "end": { label: "End", type: "tool_call", details: {} },
      },
      edges: [
        { fromNodeId: "start", toNodeId: "end", style: "SUCCESS" },
      ],
    };
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].fromNodeId).toBe("start");
    expect(graph.edges[0].toNodeId).toBe("end");
    expect(graph.edges[0].style).toBe("SUCCESS");
  });
});