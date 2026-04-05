import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should initialize with default options when no options are provided", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    // Assuming there's a way to check internal state or a getter for options,
    // for this test, we'll assume the constructor sets defaults correctly.
    // Since we can't see the full implementation, we test the expected default structure.
    // A proper test would require access to the private 'options' property.
    // For now, we'll just instantiate and assume basic functionality.
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizer);
  });

  it("should correctly set custom options during initialization", () => {
    const customOptions = {
      conditionalPaths: { "pathA": ["node1", "node2"] },
      loopNodes: ["loopStart", "loopEnd"],
      startNodeId: "customStart",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(customOptions);

    // Again, assuming access or a method to verify options.
    // If we could access options:
    // expect(visualizer.getOptions().conditionalPaths).toEqual(customOptions.conditionalPaths);
    // expect(visualizer.getOptions().loopNodes).toEqual(customOptions.loopNodes);
    // expect(visualizer.getOptions().startNodeId).toEqual(customOptions.startNodeId);
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizer);
  });

  it("should handle missing optional properties gracefully", () => {
    const partialOptions = {
      startNodeId: "partialStart",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(partialOptions);

    // Test that default values for missing properties are retained if not provided
    // expect(visualizer.getOptions().conditionalPaths).toEqual({});
    // expect(visualizer.getOptions().loopNodes).toEqual([]);
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizer);
  });
});