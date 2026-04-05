import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV2 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v2";
import { Message, ToolUseBlock, ThinkingBlock, ContentBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV2", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const messages: Message[] = [
      { type: "user", content: { type: "text", content: "Start process." } },
      { type: "assistant", content: { type: "tool_use", content: { tool_use: { tool_name: "toolA", tool_input: "inputA" } } } },
      { type: "tool_result", content: { type: "tool_result", content: { tool_name: "toolA", result: "resultA" } } },
      { type: "assistant", content: { type: "tool_use", content: { tool_use: { tool_name: "toolB", tool_input: "inputB" } } } },
    ];

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(messages);
    const graph = visualizer.buildGraph();

    expect(graph.nodes).toHaveLength(3); // user, toolA, toolB
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[0].source).toBe("user");
    expect(graph.edges[0].target).toBe("toolA");
    expect(graph.edges[1].source).toBe("toolA");
    expect(graph.edges[1].target).toBe("toolB");
  });

  it("should handle a graph with potential cycles (though the implementation might prevent explicit cycle detection in the graph structure)", () => {
    // Simulate a scenario where tool B depends on tool A, and tool A somehow depends back on B (conceptually)
    const messages: Message[] = [
      { type: "user", content: { type: "text", content: "Start." } },
      { type: "assistant", content: { type: "tool_use", content: { tool_use: { tool_name: "toolA", tool_input: "inputA" } } } },
      { type: "tool_result", content: { type: "tool_result", content: { tool_name: "toolA", result: "resultA" } } },
      { type: "assistant", content: { type: "tool_use", content: { tool_use: { tool_name: "toolB", tool_input: "inputB" } } } },
      // For testing graph structure, we rely on the sequential nature of the messages
    ];

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(messages);
    const graph = visualizer.buildGraph();

    // We expect the graph to capture the sequence, even if the underlying logic for cycle detection is complex.
    expect(graph.nodes).toContain("user");
    expect(graph.nodes).toContain("toolA");
    expect(graph.nodes).toContain("toolB");
    expect(graph.edges).toHaveLength(2);
  });

  it("should return an empty graph for empty input messages", () => {
    const messages: Message[] = [];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(messages);
    const graph = visualizer.buildGraph();

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});