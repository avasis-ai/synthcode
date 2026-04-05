import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, GraphNode, GraphEdge } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v132";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly initialize with nodes and edges", () => {
    const nodes: GraphNode[] = [
      { id: "user1", type: "user", content: "Initial user prompt" },
      { id: "assistant1", type: "assistant", content: "Thinking step" },
    ];
    const edges: GraphEdge[] = [
      { fromId: "user1", toId: "assistant1" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(nodes, edges);
    expect(visualizer.getNodes()).toEqual(nodes);
    expect(visualizer.getEdges()).toEqual(edges);
  });

  it("should handle an empty graph gracefully", () => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const visualizer = new ToolCallDependencyGraphVisualizer(nodes, edges);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should generate a basic mermaid graph structure", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "user", content: "Start" },
      { id: "tool_call", type: "assistant", content: "Tool call" },
      { id: "end", type: "user", content: "End" },
    ];
    const edges: GraphEdge[] = [
      { fromId: "start", toId: "tool_call" },
      { fromId: "tool_call", toId: "end" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(nodes, edges);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start[Start]");
    expect(mermaidCode).toContain("tool_call[Tool call]");
    expect(mermaidCode).toContain("end[End]");
    expect(mermaidCode).toContain("start --> tool_call");
  });
});