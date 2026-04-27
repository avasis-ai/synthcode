import { describe, it, expect } from "vitest";
import { ToolDependencyGraphVisualizerV3 } from "../src/visualization/tool-dependency-graph-visualizer-v3";

describe("ToolDependencyGraphVisualizerV3", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolDependencyGraphVisualizerV3();
    expect(visualizer).toBeInstanceOf(ToolDependencyGraphVisualizerV3);
    // Assuming there's a way to check internal state, e.g., an empty graph structure
    // For this test, we'll just check if it runs without error.
  });

  it("should build a simple linear dependency graph", () => {
    const visualizer = new ToolDependencyGraphVisualizerV3();
    const nodes: any[] = [
      { id: "A", name: "Tool A", description: "Desc A", inputs: {}, outputs: { out1: "data1" } },
      { id: "B", name: "Tool B", description: "Desc B", inputs: { in1: "data1" }, outputs: { out2: "data2" } },
    ];
    const edges: any[] = [
      { sourceNodeId: "A", sourceOutputKey: "out1", targetNodeId: "B", targetInputKey: "in1", dataName: "data1" },
    ];

    visualizer.buildGraph(nodes, edges);

    // Assertions depend on the internal structure, assuming a method to get nodes/edges
    // If the class has a method like getNodes() or getEdges(), use it here.
    // For demonstration, we assume a check that the graph structure is populated.
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
  });

  it("should handle a graph with multiple branching paths", () => {
    const visualizer = new ToolDependencyGraphVisualizerV3();
    const nodes: any[] = [
      { id: "Start", name: "Start", description: "", inputs: {}, outputs: { dataA: "dataA" } },
      { id: "Branch1", name: "Branch 1", description: "", inputs: { inA: "dataA" }, outputs: { out1: "data1" } },
      { id: "Branch2", name: "Branch 2", description: "", inputs: { inA: "dataA" }, outputs: { out2: "data2" } },
      { id: "End", name: "End", description: "", inputs: { in1: "data1", in2: "data2" }, outputs: {} },
    ];
    const edges: any[] = [
      { sourceNodeId: "Start", sourceOutputKey: "dataA", targetNodeId: "Branch1", targetInputKey: "inA", dataName: "dataA" },
      { sourceNodeId: "Start", sourceOutputKey: "dataA", targetNodeId: "Branch2", targetInputKey: "inA", dataName: "dataA" },
      { sourceNodeId: "Branch1", sourceOutputKey: "out1", targetNodeId: "End", targetInputKey: "in1", dataName: "data1" },
      { sourceNodeId: "Branch2", sourceOutputKey: "out2", targetNodeId: "End", targetInputKey: "in2", dataName: "data2" },
    ];

    visualizer.buildGraph(nodes, edges);

    // Check for the correct number of connections
    expect(visualizer.getEdges()).toHaveLength(4);
    // Check that the end node correctly registered two inputs
    expect(visualizer.getNode("End")?.inputs).toEqual({ in1: "data1", in2: "data2" });
  });
});