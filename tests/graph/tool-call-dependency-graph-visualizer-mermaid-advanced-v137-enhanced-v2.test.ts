import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV137EnhancedV2 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v137-enhanced-v2";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV137EnhancedV2", () => {
  it("should generate a basic graph structure for a simple sequence", () => {
    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV137EnhancedV2();
    const context = {
      messages: [
        { role: "user", content: { type: "text", text: "Start process." } },
        { role: "model", content: { type: "tool_use", tool_use: { tool_name: "toolA", input: "input1" } } },
        { role: "model", content: { type: "text", text: "Process complete." } },
      ],
      initialState: "START",
      finalState: "END",
    };

    const mermaidCode = graphVisualizer.generateGraph(context);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("START --> PROCESS_A");
    expect(mermaidCode).toContain("PROCESS_A --> END");
  });

  it("should handle multiple tool calls with conditional edges", () => {
    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV137EnhancedV2();
    const context = {
      messages: [
        { role: "user", content: { type: "text", text: "Start." } },
        { role: "model", content: { type: "tool_use", tool_use: { tool_name: "toolA", input: "input1" } } },
        // Simulate a decision point after toolA
        { role: "model", content: { type: "text", text: "Decision made." } },
        { role: "model", content: { type: "tool_use", tool_use: { tool_name: "toolB", input: "input2" } } },
      ],
      initialState: "START",
      finalState: "END",
    };

    const mermaidCode = graphVisualizer.generateGraph(context);
    expect(mermaidCode).toContain("START --> TOOL_A");
    expect(mermaidCode).toContain("TOOL_A --> DECISION");
    expect(mermaidCode).toContain("DECISION -- 'Success' --> TOOL_B");
  });

  it("should generate an empty graph if no relevant messages are present", () => {
    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV137EnhancedV2();
    const context = {
      messages: [
        { role: "user", content: { type: "text", text: "Hello." } },
      ],
      initialState: "START",
      finalState: "END",
    };

    const mermaidCode = graphVisualizer.generateGraph(context);
    expect(mermaidCode).toContain("graph TD");
    // Expect minimal structure but no complex tool/process links
    expect(mermaidCode).not.toContain("TOOL_A");
    expect(mermaidCode).not.toContain("PROCESS");
  });
});