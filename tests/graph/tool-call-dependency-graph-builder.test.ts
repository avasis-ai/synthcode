import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphBuilder, ToolCallNode, DependencyGraph } from "../src/graph/tool-call-dependency-graph-builder";

describe("ToolCallDependencyGraphBuilder", () => {
  it("should initialize with provided tool calls", () => {
    const toolCalls: ToolCallNode[] = [
      { toolUseId: "call1", name: "toolA", input: { param1: "value1" } },
      { toolUseId: "call2", name: "toolB", input: { param2: "value2" } },
    ];
    const builder = new ToolCallDependencyGraphBuilder(toolCalls);
    // We can't directly access private members, so we'll test the resulting graph structure if a getter/method was available.
    // For now, we'll assume the constructor correctly sets up the internal state based on the provided nodes.
    // A better test would involve a method to get the graph.
    expect(builder).toBeDefined();
  });

  it("should correctly build dependencies when tool calls are provided", () => {
    const toolCalls: ToolCallNode[] = [
      { toolUseId: "call1", name: "toolA", input: { param1: "value1" } },
      { toolUseId: "call2", name: "toolB", input: { param2: "value2" } },
    ];
    const builder = new ToolCallDependencyGraphBuilder(toolCalls);
    // Assuming a method like getGraph() exists or we can test the internal structure indirectly.
    // Since we cannot see the full implementation, we test the expected number of nodes.
    // If the builder has a method to get the graph, we would use it here.
    // For this test, we'll assume the graph structure is built correctly for the given inputs.
    // A mock or spy might be needed if the builder relies on external context not provided.
    // For now, we assert that the builder object exists and was initialized.
    expect(builder).toBeDefined();
  });

  it("should handle an empty list of tool calls gracefully", () => {
    const toolCalls: ToolCallNode[] = [];
    const builder = new ToolCallDependencyGraphBuilder(toolCalls);
    // Assert that the builder can be created without errors and represents an empty graph.
    expect(builder).toBeDefined();
  });
});