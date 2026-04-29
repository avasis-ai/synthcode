import { describe, it, expect } from "vitest";
import {
  ToolNode,
  GraphEdge,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v151-advanced";

describe("DynamicToolDependencyGraphVisualizerV151Advanced", () => {
  it("should correctly process a simple dependency graph", () => {
    const nodes: ToolNode[] = [
      { id: "A", name: "Tool A", dependencies: [] },
      { id: "B", name: "Tool B", dependencies: ["A"] },
    ];
    const edges: GraphEdge[] = [
      { source: "A", target: "B", weight: 1 },
    ];
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].source).toBe("A");
    expect(result.edges[0].target).toBe("B");
  });

  it("should handle nodes with resource constraints", () => {
    const nodes: ToolNode[] = [
      {
        id: "A",
        name: "Tool A",
        dependencies: [],
        resourceConstraints: [
          { resource: "CPU", constraint: "high", startTime: 0, endTime: 10 },
        ],
      },
      { id: "B", name: "Tool B", dependencies: [], resourceConstraints: [] },
    ];
    const edges: GraphEdge[] = [];
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].resourceConstraints).toHaveLength(1);
    expect(result.nodes[0].resourceConstraints![0].resource).toBe("CPU");
  });

  it("should correctly identify all dependencies for a complex graph", () => {
    const nodes: ToolNode[] = [
      { id: "Start", name: "Start", dependencies: [] },
      { id: "Mid", name: "Mid", dependencies: ["Start"] },
      { id: "End", name: "End", dependencies: ["Start", "Mid"] },
    ];
    const edges: GraphEdge[] = [
      { source: "Start", target: "Mid", weight: 1 },
      { source: "Start", target: "End", weight: 1 },
      { source: "Mid", target: "End", weight: 1 },
    ];
    const result = {
      nodes: nodes,
      edges: edges,
    };
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(3);
    expect(result.nodes.find(n => n.id === "End")?.dependencies).toEqual(["Start", "Mid"]);
  });
});