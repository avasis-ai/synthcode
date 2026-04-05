import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-enhanced-v136-final-v137-final-v138";

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with an empty graph", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly for a simple sequence", () => {
    const graph = new ToolCallDependencyGraph();
    const nodes = {
      "user_start": { description: "User input", type: "user" },
      "assistant_call": { description: "Assistant calls tool", type: "assistant" },
      "tool_result": { description: "Tool result received", type: "tool_result" },
    };
    const edges: { from: string; to: string; type: "sequence" }[] = [
      { from: "user_start", to: "assistant_call", type: "sequence" },
      { from: "assistant_call", to: "tool_result", type: "sequence" },
    ];

    (graph as any).addNodes(nodes);
    (graph as any).addEdges(edges);

    expect(graph.nodes).toEqual(nodes);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toEqual(expect.arrayContaining([
      { from: "user_start", to: "assistant_call", type: "sequence" },
      { from: "assistant_call", to: "tool_result", type: "sequence" },
    ]));
  });

  it("should handle conditional and loop dependencies", () => {
    const graph = new ToolCallDependencyGraph();
    const nodes = {
      "user_start": { description: "User input", type: "user" },
      "check_condition": { description: "Check condition", type: "assistant" },
      "success_path": { description: "Success path", type: "tool_call" },
      "failure_path": { description: "Failure path", type: "tool_call" },
    };
    const edges: { from: string; to: string; type: "conditional" | "loop" }[] = [
      { from: "user_start", to: "check_condition", type: "sequence" },
      { from: "check_condition", to: "success_path", type: "conditional", condition: "success" },
      { from: "check_condition", to: "failure_path", type: "conditional", condition: "failure" },
      { from: "success_path", to: "success_path", type: "loop", loopCondition: "retry_success" },
    ];

    (graph as any).addNodes(nodes);
    (graph as any).addEdges(edges);

    expect(graph.nodes).toEqual(nodes);
    expect(graph.edges).toHaveLength(4);
    expect(graph.edges).toEqual(expect.arrayContaining([
      { from: "user_start", to: "check_condition", type: "sequence" },
      { from: "check_condition", to: "success_path", type: "conditional", condition: "success" },
      { from: "check_condition", to: "failure_path", type: "conditional", condition: "failure" },
      { from: "success_path", to: "success_path", type: "loop", loopCondition: "retry_success" },
    ]));
  });
});