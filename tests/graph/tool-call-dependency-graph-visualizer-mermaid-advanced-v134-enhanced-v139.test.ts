import { describe, it, expect } from "vitest";
import { GraphStructure, ConditionalEdge, LoopEdge } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139";

describe("GraphStructure", () => {
  it("should correctly structure nodes with different types", () => {
    const graph: GraphStructure = {
      nodes: {
        "node1": {
          id: "node1",
          description: "Initial call",
          type: "call",
        },
        "node2": {
          id: "node2",
          description: "Tool result",
          type: "result",
        },
        "node3": {
          id: "node3",
          description: "Decision point",
          type: "decision",
        },
      },
    };
    expect(graph.nodes["node1"].type).toBe("call");
    expect(graph.nodes["node2"].type).toBe("result");
    expect(graph.nodes["node3"].type).toBe("decision");
  });

  it("should handle conditional edges correctly", () => {
    const edges: ConditionalEdge[] = [
      {
        sourceId: "node1",
        targetId: "node2",
        condition: "success",
      },
      {
        sourceId: "node1",
        targetId: "node3",
        condition: "failure",
      },
    ];
    expect(edges.length).toBe(2);
    expect(edges[0].condition).toBe("success");
    expect(edges[1].sourceId).toBe("node1");
  });

  it("should handle loop edges correctly", () => {
    const edges: LoopEdge[] = [
      {
        sourceId: "node3",
        loopTargetId: "node2",
        loopCondition: "retry_needed",
      },
    ];
    expect(edges.length).toBe(1);
    expect(edges[0].sourceId).toBe("node3");
    expect(edges[0].loopTargetId).toBe("node2");
    expect(edges[0].loopCondition).toBe("retry_needed");
  });
});