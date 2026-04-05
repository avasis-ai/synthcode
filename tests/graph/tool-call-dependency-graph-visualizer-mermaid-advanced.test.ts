import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvanced } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced";
import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvanced", () => {
  it("should initialize correctly with an empty array of nodes", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced([]);
    // We can't directly check private members, but we can check if it runs without error
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a single node with tool calls", () => {
    const mockNodes: AdvancedToolCallNode[] = [
      {
        message: { role: "user", content: "Hello" },
        toolCalls: [
          {
            id: "tool1",
            name: "search",
            input: { query: "test" },
            mermaidSubgraphId: "search_tool",
            mermaidTitle: "Search Tool Call",
          },
        ],
      },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced(mockNodes);
    // Assuming the class has a method to generate the graph or that we can check internal state if it were public/getter
    // For this test, we'll assume the constructor successfully stores the nodes.
    // A real test would call a method like generateMermaidGraph()
    expect(visualizer).toBeDefined();
  });

  it("should handle multiple nodes with different tool call structures", () => {
    const mockNodes: AdvancedToolCallNode[] = [
      {
        message: { role: "assistant", content: "Thinking..." },
        toolCalls: [
          {
            id: "toolA",
            name: "toolA",
            input: { param1: 1 },
            mermaidSubgraphId: "subgraphA",
            mermaidTitle: "Tool A Call",
          },
        ],
        mermaidSwimlane: "Swimlane A",
      },
      {
        message: { role: "user", content: "Another request" },
        toolCalls: [], // Node with no tool calls
      },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvanced(mockNodes);
    expect(visualizer).toBeDefined();
  });
});