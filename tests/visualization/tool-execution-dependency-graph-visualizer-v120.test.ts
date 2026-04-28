import { describe, it, expect } from "vitest";
import {
  ToolNodeData,
  DependencyGraphVisualizer,
  DependencyGraphVisualizerOptions,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v120";

describe("DependencyGraphVisualizer", () => {
  it("should initialize correctly with default options", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer).toBeDefined();
    // Assuming there's a way to check default state, e.g., an internal property or method
    // For this example, we just check instantiation.
  });

  it("should correctly build the graph structure from provided nodes and dependencies", () => {
    const toolNode1: ToolNodeData = {
      tool_name: "ToolA",
      inputs: { id: "1" },
      metadata: {},
    };
    const toolNode2: ToolNodeData = {
      tool_name: "ToolB",
      inputs: { id: "2" },
      metadata: {},
    };
    const dependencies = [
      { source: "ToolA", target: "ToolB" },
    ];

    const options: DependencyGraphVisualizerOptions = {
      nodes: [toolNode1, toolNode2],
      dependencies: dependencies,
    };

    const visualizer = new DependencyGraphVisualizer(options);
    // Assuming the visualizer has a method or property to check the resulting graph structure
    // We'll mock an expected structure check here.
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getDependencies()).toHaveLength(1);
  });

  it("should handle empty inputs gracefully", () => {
    const options: DependencyGraphVisualizerOptions = {
      nodes: [],
      dependencies: [],
    };

    const visualizer = new DependencyGraphVisualizer(options);
    expect(visualizer.getNodes()).toHaveLength(0);
    expect(visualizer.getDependencies()).toHaveLength(0);
  });
});