import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvanced } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new";

describe("ToolCallDependencyGraphVisualizerMermaidAdvanced", () => {
  it("should generate a basic graph for a simple sequence of calls", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced();
    const graph = visualizer.generateGraph(
      [
        { type: "user", content: "Start process" },
        { type: "assistant", content: "Tool call A" },
        { type: "tool_result", content: "Result A" },
        { type: "assistant", content: "End process" },
      ]
    );
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[Start process]");
    expect(graph).toContain("B[Tool call A]");
    expect(graph).toContain("C[Result A]");
    expect(graph).toContain("D[End process]");
  });

  it("should handle conditional branching correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced();
    const graph = visualizer.generateGraph(
      [
        { type: "user", content: "Check condition" },
        { type: "assistant", content: "Tool call B" },
        // Simulate a condition leading to two paths
        { type: "conditional", content: "Condition Check" },
        { type: "tool_result", content: "Condition True Result" },
        { type: "tool_result", content: "Condition False Result" },
      ]
    );
    expect(graph).toContain("B -->|True| E[Condition True Result]");
    expect(graph).toContain("B -->|False| F[Condition False Result]");
  });

  it("should correctly represent a loop dependency", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced();
    const graph = visualizer.generateGraph(
      [
        { type: "user", content: "Start loop" },
        { type: "assistant", content: "Tool call Loop" },
        { type: "tool_result", content: "Loop Result" },
        // Simulate a loop back to the tool call
        { type: "loop", content: "Loop back" },
      ]
    );
    expect(graph).toContain("LoopStart -->|Loop| ToolCallNode");
    expect(graph).toContain("ToolCallNode -->|Loop| ToolCallNode");
  });
});