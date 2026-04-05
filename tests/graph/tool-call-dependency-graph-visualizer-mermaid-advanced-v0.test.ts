import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV0 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v0";
import { DependencyGraph, Node } from "../src/graph/dependency-graph-types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV0", () => {
  it("should correctly generate mermaid graph for a simple user-assistant interaction", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "user", type: "user", label: "User Input" },
        { id: "assistant", type: "assistant", label: "Assistant Response" },
      ],
      edges: [
        { source: "user", target: "assistant", type: "message" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV0(graph);
    const mermaidCode = visualizer.generateMermaid();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user[User Input]");
    expect(mermaidCode).toContain("assistant[Assistant Response]");
    expect(mermaidCode).toContain("user --> assistant");
  });

  it("should correctly generate mermaid graph for a tool call sequence", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "user", type: "user", label: "User Input" },
        { id: "assistant_tool_call", type: "tool_call", label: "Tool Call" },
        { id: "model_response", type: "assistant", label: "Assistant Response" },
      ],
      edges: [
        { source: "user", target: "assistant_tool_call", type: "message" },
        { source: "assistant_tool_call", target: "model_response", type: "tool_use" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV0(graph);
    const mermaidCode = visualizer.generateMermaid();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user[User Input]");
    expect(mermaidCode).toContain("assistant_tool_call[Tool Call]");
    expect(mermaidCode).toContain("model_response[Assistant Response]");
    expect(mermaidCode).toContain("user --> assistant_tool_call");
    expect(mermaidCode).toContain("assistant_tool_call --> model_response");
  });

  it("should handle a graph with multiple tool calls", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "user", type: "user", label: "User Input" },
        { id: "tool_call_1", type: "tool_call", label: "Tool Call 1" },
        { id: "tool_response_1", type: "tool_output", label: "Tool Output 1" },
        { id: "tool_call_2", type: "tool_call", label: "Tool Call 2" },
        { id: "tool_response_2", type: "tool_output", label: "Tool Output 2" },
        { id: "assistant", type: "assistant", label: "Final Response" },
      ],
      edges: [
        { source: "user", target: "tool_call_1", type: "message" },
        { source: "tool_call_1", target: "tool_response_1", type: "tool_use" },
        { source: "tool_response_1", target: "tool_call_2", type: "message" },
        { source: "tool_call_2", target: "tool_response_2", type: "tool_use" },
        { source: "tool_response_2", target: "assistant", type: "message" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV0(graph);
    const mermaidCode = visualizer.generateMermaid();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user[User Input]");
    expect(mermaidCode).toContain("tool_call_1[Tool Call 1]");
    expect(mermaidCode).toContain("tool_response_1[Tool Output 1]");
    expect(mermaidCode).toContain("tool_call_2[Tool Call 2]");
    expect(mermaidCode).toContain("tool_response_2[Tool Output 2]");
    expect(mermaidCode).toContain("assistant[Final Response]");
    expect(mermaidCode).toContain("user --> tool_call_1");
    expect(mermaidCode).toContain("tool_response_2 --> assistant");
  });
});