import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraph,
  GraphNode,
  DependencyEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v132-enhanced";

describe("ToolCallDependencyGraph", () => {
  it("should correctly construct a basic graph from simple messages", () => {
    const nodes: GraphNode[] = [
      { id: "user1", message: { type: "user", content: "Start" } },
      { id: "assistant1", message: { type: "assistant", content: "Response" } },
    ];
    const edges: DependencyEdge[] = [
      { from: "user1", to: "assistant1", type: "prerequisite" },
    ];
    const graph: ToolCallDependencyGraph = { nodes, edges };

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].type).toBe("prerequisite");
  });

  it("should handle conditional dependencies with prerequisites and else paths", () => {
    const nodes: GraphNode[] = [
      { id: "user", message: { type: "user", content: "Check A" } },
      { id: "tool_call_a", message: { type: "tool_use", content: "Call A" } },
      { id: "tool_result_a", message: { type: "tool_result", content: "Result A" } },
      { id: "tool_call_b", message: { type: "tool_use", content: "Call B" } },
    ];
    const edges: DependencyEdge[] = [
      {
        from: "user",
        to: "tool_call_a",
        type: "prerequisite",
      },
      {
        from: "tool_call_a",
        to: "tool_result_a",
        type: "conditional",
        condition: "Success",
        elsePath: "Fallback",
      },
      {
        from: "tool_result_a",
        to: "tool_call_b",
        type: "conditional",
        condition: "Success",
      },
    ];
    const graph: ToolCallDependencyGraph = { nodes, edges };

    expect(graph.edges.length).toBe(3);
    const conditionalEdge = graph.edges.find(
      (e) => e.from === "tool_call_a" && e.to === "tool_result_a"
    );
    expect(conditionalEdge).toBeDefined();
    expect(conditionalEdge!.type).toBe("conditional");
    expect(conditionalEdge!.condition).toBe("Success");
    expect(conditionalEdge!.elsePath).toBe("Fallback");
  });

  it("should return an empty graph when no dependencies are present", () => {
    const nodes: GraphNode[] = [
      { id: "user", message: { type: "user", content: "Hello" } },
    ];
    const edges: DependencyEdge[] = [];
    const graph: ToolCallDependencyGraph = { nodes, edges };

    expect(graph.nodes.length).toBe(1);
    expect(graph.edges.length).toBe(0);
  });
});