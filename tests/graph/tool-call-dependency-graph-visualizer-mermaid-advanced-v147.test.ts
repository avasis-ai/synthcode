import { describe, it, expect } from "vitest";
import { AdvancedGraphStructure } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v147";

describe("AdvancedGraphStructure", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: AdvancedGraphStructure = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly represent a simple linear flow", () => {
    const graph: AdvancedGraphStructure = {
      nodes: [
        { id: "start", type: "start", label: "Start" },
        { id: "tool1", type: "tool_call", label: "Tool A" },
        { id: "end", type: "end", label: "End" },
      ],
      edges: [
        { from: "start", to: "tool1", label: "Success" },
        { from: "tool1", to: "end", label: "Success" },
      ],
    };
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.nodes[1].type).toBe("tool_call");
  });

  it("should handle conditional branching", () => {
    const graph: AdvancedGraphStructure = {
      nodes: [
        { id: "start", type: "start", label: "Start" },
        { id: "condition", type: "conditional", label: "Check Result" },
        { id: "success_path", type: "tool_call", label: "Success Tool" },
        { id: "failure_path", type: "tool_call", label: "Failure Tool" },
        { id: "end", type: "end", label: "End" },
      ],
      edges: [
        { from: "start", to: "condition", label: "Default" },
        { from: "condition", to: "success_path", condition: "success", label: "Success" },
        { from: "condition", to: "failure_path", condition: "failure", label: "Failure" },
        { from: "success_path", to: "end", label: "Success" },
      ],
    };
    expect(graph.nodes.some(n => n.type === "conditional")).toBe(true);
    expect(graph.edges.some(e => e.condition === "failure")).toBe(true);
  });
});