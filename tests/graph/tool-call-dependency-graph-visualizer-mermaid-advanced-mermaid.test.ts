import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-mermaid";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid", () => {
  it("should generate a basic graph structure for a simple tool call sequence", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid();
    const graphStructure = {
      nodes: [
        { id: "start", type: "call", label: "Start", details: {} },
        { id: "tool_call_1", type: "call", label: "Tool A Call", details: {} },
        { id: "end", type: "call", label: "End", details: {} },
      ],
      edges: [
        { from: "start", to: "tool_call_1" },
        { from: "tool_call_1", to: "end" },
      ],
    };
    const mermaidCode = visualizer.generateMermaid(graphStructure);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start --> tool_call_1");
    expect(mermaidCode).toContain("tool_call_1 --> end");
  });

  it("should handle conditional flow logic (if/else)", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid();
    const graphStructure = {
      nodes: [
        { id: "start", type: "call", label: "Start", details: {} },
        { id: "condition", type: "flow", label: "Check Condition", details: { condition: "success" } },
        { id: "success_path", type: "call", label: "Success Action", details: {} },
        { id: "failure_path", type: "call", label: "Failure Action", details: {} },
        { id: "end", type: "call", label: "End", details: {} },
      ],
      edges: [
        { from: "start", to: "condition" },
        { from: "condition", to: "success_path", label: "True" },
        { from: "condition", to: "failure_path", label: "False" },
        { from: "success_path", to: "end" },
        { from: "failure_path", to: "end" },
      ],
    };
    const mermaidCode = visualizer.generateMermaid(graphStructure);
    expect(mermaidCode).toContain("if");
    expect(mermaidCode).toContain("condition -- True --> success_path");
    expect(mermaidCode).toContain("condition -- False --> failure_path");
  });

  it("should correctly represent a loop structure", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedMermaid();
    const graphStructure = {
      nodes: [
        { id: "start", type: "call", label: "Start", details: {} },
        { id: "loop_check", type: "flow", label: "Loop Check", details: { condition: "continue" } },
        { id: "loop_body", type: "call", label: "Loop Body", details: {} },
        { id: "end", type: "call", label: "End", details: {} },
      ],
      edges: [
        { from: "start", to: "loop_check" },
        { from: "loop_check", to: "loop_body", label: "Continue" },
        { from: "loop_body", to: "loop_check" },
        { from: "loop_check", to: "end", label: "Exit" },
      ],
    };
    const mermaidCode = visualizer.generateMermaid(graphStructure);
    expect(mermaidCode).toContain("loop");
    expect(mermaidCode).toContain("loop_check -- Continue --> loop_body");
    expect(mermaidCode).toContain("loop_body --> loop_check");
    expect(mermaidCode).toContain("loop_check -- Exit --> end");
  });
});