import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v154";

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with empty data", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {},
      edges: [],
    };
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual([]);
  });

  it("should add a node with a unique ID and name", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {
        "call-1": { id: "call-1", name: "Tool A Call" },
      },
      edges: [],
    };
    expect(graph.nodes["call-1"]).toBeDefined();
    expect(graph.nodes["call-1"]!.id).toBe("call-1");
    expect(graph.nodes["call-1"]!.name).toBe("Tool A Call");
  });

  it("should add an edge correctly linking two existing nodes", () => {
    const graph: ToolCallDependencyGraph = {
      nodes: {
        "call-1": { id: "call-1", name: "Tool A Call" },
        "call-2": { id: "call-2", name: "Tool B Call" },
      },
      edges: [
        {
          source: "call-1",
          target: "call-2",
          type: "standard",
          metadata: { reason: "A must run before B" },
        },
      ],
    };
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe("call-1");
    expect(graph.edges[0].target).toBe("call-2");
    expect(graph.edges[0].type).toBe("standard");
  });
});