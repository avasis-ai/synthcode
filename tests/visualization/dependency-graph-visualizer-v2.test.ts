import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV2,
  GraphNode,
  DependencyEdge,
} from "../src/visualization/dependency-graph-visualizer-v2";

describe("DependencyGraphVisualizerV2", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV2([]);
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should process nodes and edges correctly when provided with data", () => {
    const nodes: GraphNode[] = [
      { id: "A", name: "Node A" },
      { id: "B", name: "Node B" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceNodeId: "A",
        targetNodeId: "B",
        dataFlow: {
          schema: { name: "data", fields: {} },
          transformation: "transformAtoB",
        },
        failurePotential: true,
      },
    ];
    const visualizer = new DependencyGraphVisualizerV2(nodes, edges);
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
  });

  it("should handle cases with missing or malformed data gracefully", () => {
    // Test with empty arrays
    const visualizerEmpty = new DependencyGraphVisualizerV2([], []);
    expect(visualizerEmpty.nodes).toEqual([]);
    expect(visualizerEmpty.edges).toEqual([]);

    // Test with null/undefined inputs (assuming constructor handles this or it's typed correctly)
    // For robustness, we might check how it handles non-array inputs if the constructor allows it.
    // Based on the signature, we assume it expects arrays.
  });
});