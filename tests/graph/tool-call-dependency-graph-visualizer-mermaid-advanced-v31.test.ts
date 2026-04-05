import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphVisualizerMermaidAdvancedV31,
  DependencyNode,
  DependencyEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v31";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV31", () => {
  it("should generate a basic graph for a simple tool call sequence", () => {
    const nodes: DependencyNode[] = [
      { id: "start", type: "start", label: "Start", metadata: {} },
      { id: "tool_call_1", type: "tool_call", label: "Call Tool A", metadata: {} },
      { id: "end", type: "end", label: "End", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { from: "start", to: "tool_call_1", label: "Success", type: "success" },
      { from: "tool_call_1", to: "end", label: "Success", type: "success" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV31();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("start[Start]");
    expect(mermaidDiagram).toContain("tool_call_1[Call Tool A]");
    expect(mermaidDiagram).toContain("end[End]");
    expect(mermaidDiagram).toContain("start --> tool_call_1");
    expect(mermaidDiagram).toContain("tool_call_1 --> end");
  });

  it("should handle conditional branching paths", () => {
    const nodes: DependencyNode[] = [
      { id: "start", type: "start", label: "Start", metadata: {} },
      { id: "condition_check", type: "conditional", label: "Check Condition", metadata: {} },
      { id: "success_path", type: "tool_call", label: "Success Path", metadata: {} },
      { id: "fallback_path", type: "fallback", label: "Fallback Path", metadata: {} },
      { id: "end", type: "end", label: "End", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { from: "start", to: "condition_check", label: "Start", type: "success" },
      { from: "condition_check", to: "success_path", label: "True", type: "condition", condition: "True" },
      { from: "condition_check", to: "fallback_path", label: "False", type: "condition", condition: "False" },
      { from: "success_path", to: "end", label: "Success", type: "success" },
      { from: "fallback_path", to: "end", label: "Fallback", type: "fallback" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV31();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("condition_check{Check Condition}");
    expect(mermaidDiagram).toContain("success_path[Success Path]");
    expect(mermaidDiagram).toContain("fallback_path[Fallback Path]");
    expect(mermaidDiagram).toContain("condition_check -- True --> success_path");
    expect(mermaidDiagram).toContain("condition_check -- False --> fallback_path");
  });

  it("should correctly format nodes with different types and labels", () => {
    const nodes: DependencyNode[] = [
      { id: "start", type: "start", label: "Start", metadata: {} },
      { id: "tool_call", type: "tool_call", label: "Tool Call", metadata: { tool: "A" } },
      { id: "conditional", type: "conditional", label: "Decision Point", metadata: {} },
      { id: "end", type: "end", label: "End", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { from: "start", to: "tool_call", label: "Start", type: "success" },
      { from: "tool_call", to: "conditional", label: "Result", type: "success" },
      { from: "conditional", to: "end", label: "Final", type: "success" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV31();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("start[Start]");
    expect(mermaidDiagram).toContain("tool_call[Tool Call]");
    expect(mermaidDiagram).toContain("conditional{Decision Point}");
    expect(mermaidDiagram).toContain("end[End]");
    expect(mermaidDiagram).toContain("tool_call --> conditional");
  });
});