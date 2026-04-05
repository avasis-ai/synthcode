import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-basic-advanced-v3";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly initialize with a basic graph structure", () => {
    const nodes = ["nodeA", "nodeB"];
    const edges = [{ from: "nodeA", to: "nodeB", label: "calls" }];
    const visualizer = new ToolCallDependencyGraphVisualizer({ nodes, edges });

    // We can't easily test private members, but we can test the public interface's assumption
    // that the graph is set up correctly.
    // A more robust test would involve checking the internal state if it were exposed.
    // For now, we ensure instantiation doesn't throw.
    expect(visualizer).toBeDefined();
  });

  it("should handle a graph with multiple nodes and edges", () => {
    const nodes = ["start", "step1", "step2", "end"];
    const edges = [
      { from: "start", to: "step1", label: "init" },
      { from: "step1", to: "step2", label: "process" },
      { from: "step2", to: "end", label: "finish" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer({ nodes, edges });

    // Check if the visualizer object seems capable of handling the structure
    // (This assumes the class has methods that rely on the graph being set)
    expect(visualizer).toBeDefined();
  });

  it("should handle an empty graph", () => {
    const nodes: string[] = [];
    const edges: { from: string; to: string; label: string }[] = [];
    const visualizer = new ToolCallDependencyGraphVisualizer({ nodes, edges });

    // Ensure it initializes without errors for an empty graph
    expect(visualizer).toBeDefined();
  });
});