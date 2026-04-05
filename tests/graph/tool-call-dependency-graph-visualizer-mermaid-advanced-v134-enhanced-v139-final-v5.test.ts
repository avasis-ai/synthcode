import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV13 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v5";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV13", () => {
  it("should generate a basic linear graph for simple tool calls", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13();
    const nodes: { id: string; type: "start" | "tool_call" | "conditional" | "fallback" | "end"; label: string; details?: Record<string, unknown> }[] = [
      { id: "start", type: "start", label: "Start" },
      { id: "tool1", type: "tool_call", label: "Tool A Call" },
      { id: "end", type: "end", label: "End" },
    ];
    const edges: { fromId: string; toId: string; label: string; condition?: string }[] = [
      { fromId: "start", toId: "tool1", label: "Success" },
      { fromId: "tool1", toId: "end", label: "Success" },
    ];

    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);
    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("start[Start]");
    expect(mermaidDiagram).toContain("tool1[Tool A Call]");
    expect(mermaidDiagram).toContain("start --> tool1: Success");
  });

  it("should handle conditional branching paths", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13();
    const nodes: { id: string; type: "start" | "tool_call" | "conditional" | "fallback" | "end"; label: string; details?: Record<string, unknown> }[] = [
      { id: "start", type: "start", label: "Start" },
      { id: "conditional", type: "conditional", label: "Check Result" },
      { id: "success_path", type: "tool_call", label: "Success Tool" },
      { id: "fallback_path", type: "fallback", label: "Error Tool" },
      { id: "end", type: "end", label: "End" },
    ];
    const edges: { fromId: string; toId: string; label: string; condition?: string }[] = [
      { fromId: "start", toId: "conditional", label: "Start" },
      { fromId: "conditional", toId: "success_path", label: "Success", condition: "success" },
      { fromId: "conditional", toId: "fallback_path", label: "Failure", condition: "failure" },
      { fromId: "success_path", toId: "end", label: "Done" },
      { fromId: "fallback_path", toId: "end", label: "Done" },
    ];

    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);
    expect(mermaidDiagram).toContain("conditional[Check Result]");
    expect(mermaidDiagram).toContain("conditional -- Success --> success_path");
    expect(mermaidDiagram).toContain("conditional -- Failure --> fallback_path");
  });

  it("should correctly format nodes with details", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13();
    const nodes: { id: string; type: "start" | "tool_call" | "conditional" | "fallback" | "end"; label: string; details?: Record<string, unknown> }[] = [
      { id: "start", type: "start", label: "Start", details: { input: "user query" } },
      { id: "tool1", type: "tool_call", label: "Tool A", details: { toolName: "toolA", params: "..." } },
    ];
    const edges: { fromId: string; toId: string; label: string; condition?: string }[] = [
      { fromId: "start", toId: "tool1", label: "Execute" },
    ];

    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);
    expect(mermaidDiagram).toContain("start{Start}"); // Assuming details might affect node shape/content
    expect(mermaidDiagram).toContain("tool1{Tool A}");
    expect(mermaidDiagram).toContain("start --> tool1: Execute");
  });
});