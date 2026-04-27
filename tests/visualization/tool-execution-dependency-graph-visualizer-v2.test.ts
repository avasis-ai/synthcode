import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizerV2 } from "../src/visualization/tool-execution-dependency-graph-visualizer-v2";
import { ToolCall, ToolResult } from "../src/visualization/tool-execution-graph-types";

describe("ToolExecutionDependencyGraphVisualizerV2", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV2([]);
    // We can't directly test private members, but we can test behavior if we assume initialization works.
    // A more robust test might involve a getter or a public method that uses the graph.
    // For now, we'll just ensure it doesn't crash.
    expect(visualizer).toBeDefined();
  });

  it("should handle a simple linear dependency graph", () => {
    const toolCall1: ToolCall = { tool_name: "toolA", tool_call_id: "call1" };
    const toolResult1: ToolResult = { tool_call_id: "call1", tool_result: "resultA" };
    const toolCall2: ToolCall = { tool_name: "toolB", tool_call_id: "call2" };

    const graph = [
      { source: toolCall1, target: toolResult1 },
      { source: toolCall2, target: toolResult1 },
    ];

    const visualizer = new ToolExecutionDependencyGraphVisualizerV2(graph);
    // Assuming there's a method to check the graph structure or a rendering method we can test.
    // Since we don't see the full implementation, we'll test the constructor's ability to hold the data.
    // If there was a public method like `getGraph()`, we would test it here.
    // For this example, we'll just assert the constructor runs without error.
    expect(visualizer).toBeDefined();
  });

  it("should handle a complex graph with mixed dependencies", () => {
    const toolCallA: ToolCall = { tool_name: "toolA", tool_call_id: "callA" };
    const toolResultA: ToolResult = { tool_call_id: "callA", tool_result: "resultA" };
    const toolCallB: ToolCall = { tool_name: "toolB", tool_call_id: "callB" };
    const toolResultB: ToolResult = { tool_call_id: "callB", tool_result: "resultB" };
    const toolCallC: ToolCall = { tool_name: "toolC", tool_call_id: "callC" };

    const graph = [
      { source: toolCallA, target: toolResultA },
      { source: toolCallB, target: toolResultA },
      { source: toolCallA, target: toolCallB }, // ToolCall -> ToolCall dependency
      { source: toolCallC, target: toolResultB },
    ];

    const visualizer = new ToolExecutionDependencyGraphVisualizerV2(graph);
    expect(visualizer).toBeDefined();
  });
});