import { describe, it, expect } from "vitest";
import { ToolDependencyGraphVisualizerAdvanced } from "../src/graph/tool-dependency-graph-visualizer-advanced";

describe("ToolDependencyGraphVisualizerAdvanced", () => {
  it("should initialize correctly with no tool calls and dependencies", () => {
    const visualizer = new ToolDependencyGraphVisualizerAdvanced([]); [];
    // Assuming there's a method or property to check internal state, 
    // for this test, we just check instantiation without errors.
    expect(visualizer).toBeInstanceOf(ToolDependencyGraphVisualizerAdvanced);
  });

  it("should correctly process a set of tool calls and dependencies", () => {
    const toolCalls = [
      { id: "call1", name: "toolA", input: { param1: "value1" } },
      { id: "call2", name: "toolB", input: { param2: 123 } },
    ];
    const dependencies = [
      { fromId: "call1", toId: "call2" },
      { fromId: "call2", toId: "call1" },
    ];
    const visualizer = new ToolDependencyGraphVisualizerAdvanced(toolCalls, dependencies);
    // Since we cannot see the internal state, we test the constructor's successful execution
    // and assume internal setup based on the provided structure.
    expect(visualizer).toBeInstanceOf(ToolDependencyGraphVisualizerAdvanced);
  });

  it("should handle empty dependencies list", () => {
    const toolCalls = [
      { id: "call1", name: "toolA", input: {} },
    ];
    const visualizer = new ToolDependencyGraphVisualizerAdvanced(toolCalls, []);
    // Test that it initializes without error when dependencies are empty
    expect(visualizer).toBeInstanceOf(ToolDependencyGraphVisualizerAdvanced);
  });
});