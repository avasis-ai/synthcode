import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV100 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v100";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV100", () => {
  it("should generate a basic graph structure for a simple tool call sequence", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV100();
    const nodes = [
      { id: "user_msg", label: "User Input", type: "user" },
      { id: "tool_call_1", label: "Tool Call A", type: "assistant" },
      { id: "tool_result_1", label: "Tool Result A", type: "tool_result" },
    ];
    const edges = [
      { fromNodeId: "user_msg", toNodeId: "tool_call_1", label: "Calls", style: "success" },
      { fromNodeId: "tool_call_1", toNodeId: "tool_result_1", label: "Result", style: "success" },
    ];
    const mermaidDiagram = visualizer.generate(nodes, edges);
    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("user_msg[User Input]");
    expect(mermaidDiagram).toContain("tool_result_1[Tool Result A]");
  });

  it("should handle a sequence involving thinking steps", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV100();
    const nodes = [
      { id: "user_msg", label: "User Input", type: "user" },
      { id: "thinking_step", label: "Thinking Process", type: "thinking" },
      { id: "tool_call_2", label: "Tool Call B", type: "assistant" },
    ];
    const edges = [
      { fromNodeId: "user_msg", toNodeId: "thinking_step", label: "Starts with", style: "info" },
      { fromNodeId: "thinking_step", toNodeId: "tool_call_2", label: "Leads to", style: "success" },
    ];
    const mermaidDiagram = visualizer.generate(nodes, edges);
    expect(mermaidDiagram).toContain("thinking_step[Thinking Process]");
    expect(mermaidDiagram).toContain("thinking_step --> tool_call_2");
  });

  it("should generate correct labels and styles for multiple tool interactions", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV100();
    const nodes = [
      { id: "user_msg", label: "User Query", type: "user" },
      { id: "tool_call_A", label: "Call A", type: "assistant" },
      { id: "tool_result_A", label: "Result A", type: "tool_result" },
      { id: "tool_call_B", label: "Call B", type: "assistant" },
      { id: "tool_result_B", label: "Result B", type: "tool_result" },
    ];
    const edges = [
      { fromNodeId: "user_msg", toNodeId: "tool_call_A", label: "Calls", style: "success" },
      { fromNodeId: "tool_call_A", toNodeId: "tool_result_A", label: "Result", style: "success" },
      { fromNodeId: "tool_result_A", toNodeId: "tool_call_B", label: "Uses", style: "info" },
      { fromNodeId: "tool_call_B", toNodeId: "tool_result_B", label: "Final Result", style: "success" },
    ];
    const mermaidDiagram = visualizer.generate(nodes, edges);
    expect(mermaidDiagram).toContain("tool_call_A[Call A]");
    expect(mermaidDiagram).toContain("tool_result_B[Result B]");
    expect(mermaidDiagram).toContain("tool_result_A --> tool_call_B");
  });
});