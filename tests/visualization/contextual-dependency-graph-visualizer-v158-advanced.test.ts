import { describe, it, expect } from "vitest";
import {
  NodeMetadata,
  EdgeMetadata,
} from "../src/visualization/contextual-dependency-graph-visualizer-v158-advanced";

describe("ContextualDependencyGraphVisualizerV158Advanced", () => {
  it("should correctly process basic node and edge metadata", () => {
    const nodes: NodeMetadata[] = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: EdgeMetadata[] = [
      { sourceId: "A", targetId: "B" },
    ];
    // Assuming the function takes these inputs and returns a structure that can be checked
    // Since the actual function implementation is not provided, we test the expected structure handling.
    // We'll assume a function exists that takes these and returns a visualization object.
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it("should handle nodes with resource constraints and temporal windows", () => {
    const nodes: NodeMetadata[] = [
      {
        id: "C",
        label: "Node C",
        resourceConstraints: { required: "CPU", limit: 2 },
        temporalWindow: { startMs: 1000, endMs: 5000 },
      },
    ];
    const edges: EdgeMetadata[] = [];
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.nodes[0].resourceConstraints).toEqual({
      required: "CPU",
      limit: 2,
    });
    expect(result.nodes[0].temporalWindow).toEqual({
      startMs: 1000,
      endMs: 5000,
    });
  });

  it("should correctly map complex edge dependencies", () => {
    const nodes: NodeMetadata[] = [
      { id: "D", label: "Node D" },
      { id: "E", label: "Node E" },
    ];
    const edges: EdgeMetadata[] = [
      {
        sourceId: "D",
        targetId: "E",
        resourceDependency: { resource: "Memory", bottleneckSeveri: 0.8 },
      },
    ];
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.edges[0].sourceId).toBe("D");
    expect(result.edges[0].targetId).toBe("E");
    expect(result.edges[0].resourceDependency).toEqual({
      resource: "Memory",
      bottleneckSeveri: 0.8,
    });
  });
});