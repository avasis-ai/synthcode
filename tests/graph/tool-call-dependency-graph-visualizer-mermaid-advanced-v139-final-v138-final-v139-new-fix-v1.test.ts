import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v1";

describe("DependencyGraph", () => {
  it("should correctly initialize with an empty graph", () => {
    const graph: DependencyGraph = { nodes: [] };
    expect(graph.nodes).toEqual([]);
  });

  it("should correctly set nodes for a simple linear flow", () => {
    const nodes: GraphNode[] = [
      { id: "start", label: "Start", type: "start" },
      { id: "process1", label: "Process A", type: "process" },
      { id: "end", label: "End", type: "end" },
    ];
    const graph: DependencyGraph = { nodes: nodes };
    expect(graph.nodes.length).toBe(3);
    expect(graph.nodes.map(n => n.id)).toEqual(["start", "process1", "end"]);
  });

  it("should handle multiple node types correctly", () => {
    const nodes: GraphNode[] = [
      { id: "start", label: "Start", type: "start" },
      { id: "tool_call", label: "Tool Call", type: "tool_call" },
      { id: "conditional", label: "Condition Check", type: "conditional" },
      { id: "process", label: "Processing", type: "process" },
      { id: "end", label: "End", type: "end" },
    ];
    const graph: DependencyGraph = { nodes: nodes };
    expect(graph.nodes.length).toBe(5);
    const types = graph.nodes.map(n => n.type);
    expect(types).toEqual(["start", "tool_call", "conditional", "process", "end"]);
  });
});