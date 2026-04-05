import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMerm } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v26";

describe("ToolCallDependencyGraphVisualizerMerm", () => {
  it("should generate basic mermaid code for a simple tool call sequence", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMerm();
    const graph: any = {
      messages: [
        { id: "user1", type: "user", content: "Call tool A" },
        { id: "tool_call_a", type: "tool_use", content: { toolName: "toolA", arguments: {} } },
        { id: "tool_result_a", type: "tool_result", content: { toolName: "toolA", result: "Success" } },
      ],
      dependencies: [
        { sourceId: "user1", targetId: "tool_call_a", relationship: "calls" },
        { sourceId: "tool_call_a", targetId: "tool_result_a", relationship: "follows" },
      ],
    };
    const mermaidCode = visualizer.generateMermaidCode(graph);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user1 -->|calls| tool_call_a");
    expect(mermaidCode).toContain("tool_call_a -->|follows| tool_result_a");
  });

  it("should handle multiple dependencies and different relationship types", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMerm();
    const graph: any = {
      messages: [
        { id: "user1", type: "user", content: "Start" },
        { id: "tool_call_a", type: "tool_use", content: { toolName: "toolA", arguments: {} } },
        { id: "tool_result_a", type: "tool_result", content: { toolName: "toolA", result: "Success" } },
        { id: "tool_call_b", type: "tool_use", content: { toolName: "toolB", arguments: {} } },
        { id: "tool_result_b", type: "tool_result", content: { toolName: "toolB", result: "Success" } },
      ],
      dependencies: [
        { sourceId: "user1", targetId: "tool_call_a", relationship: "calls" },
        { sourceId: "tool_call_a", targetId: "tool_result_a", relationship: "follows" },
        { sourceId: "tool_result_a", targetId: "tool_call_b", relationship: "depends_on" },
        { sourceId: "tool_call_b", targetId: "tool_result_b", relationship: "follows" },
      ],
    };
    const mermaidCode = visualizer.generateMermaidCode(graph);
    expect(mermaidCode).toContain("user1 -->|calls| tool_call_a");
    expect(mermaidCode).toContain("tool_result_a -->|depends_on| tool_call_b");
    expect(mermaidCode).toContain("tool_call_b -->|follows| tool_result_b");
  });

  it("should generate empty or minimal code for an empty graph", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMerm();
    const graph: any = {
      messages: [],
      dependencies: [],
    };
    const mermaidCode = visualizer.generateMermaidCode(graph);
    expect(mermaidCode).toBe("graph TD\n"); // Expecting a minimal valid graph structure
  });
});