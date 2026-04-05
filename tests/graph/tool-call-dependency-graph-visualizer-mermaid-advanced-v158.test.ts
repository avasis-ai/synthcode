import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV158 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v158";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV158", () => {
  it("should generate a basic graph structure for simple tool calls", () => {
    const context: any = {
      messages: [
        { type: "user", content: "Call tool A and then tool B" }
      ],
      toolCalls: [
        { id: "call1", name: "toolA", input: { param1: "value1" } },
        { id: "call2", name: "toolB", input: { param2: "value2" } }
      ],
      dependencies: [
        { from: "call1", to: "call2" }
      ]
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV158(context);
    const mermaidCode = visualizer.generateGraph();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("call1 --> call2");
  });

  it("should handle complex dependencies including conditional paths", () => {
    const context: any = {
      messages: [
        { type: "user", content: "Check condition X, then call tool C if true, else tool D" }
      ],
      toolCalls: [
        { id: "callC", name: "toolC", input: {} },
        { id: "callD", name: "toolD", input: {} }
      ],
      dependencies: [
        { from: "callC", to: "callD", condition: "conditionX_true" },
        { from: "callC", to: "callD", condition: "conditionX_false" }
      ]
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV158(context);
    const mermaidCode = visualizer.generateGraph();
    expect(mermaidCode).toContain("callC");
    expect(mermaidCode).toContain("callC -- conditionX_true --> callD");
    expect(mermaidCode).toContain("callC -- conditionX_false --> callD");
  });

  it("should generate an empty graph if no tool calls or dependencies are present", () => {
    const context: any = {
      messages: [{ type: "user", content: "Just a chat" }],
      toolCalls: [],
      dependencies: []
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV158(context);
    const mermaidCode = visualizer.generateGraph();
    expect(mermaidCode).toContain("graph TD");
    // Expecting minimal graph structure or an empty representation if no nodes are defined
    expect(mermaidCode).not.toContain("-->");
  });
});