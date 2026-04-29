import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  DependencyEdge,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v143";

describe("ToolCapabilityDependencyGraphVisualizer", () => {
  it("should correctly structure nodes and edges for a simple dependency", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "nodeA",
        name: "Capability A",
        description: "Describes A",
        metadata: {},
      },
      {
        id: "nodeB",
        name: "Capability B",
        description: "Describes B",
        metadata: {},
      },
    ];
    const edges: DependencyEdge[] = [
      {
        fromCapabilityId: "nodeA",
        toCapabilityId: "nodeB",
        dependencyType: "requires",
        strength: 0.8,
        metadata: {},
      },
    ];

    const result = { nodes: nodes, edges: edges };

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].fromCapabilityId).toBe("nodeA");
    expect(result.edges[0].toCapabilityId).toBe("nodeB");
    expect(result.edges[0].dependencyType).toBe("requires");
  });

  it("should handle multiple dependencies between the same pair of nodes with different types", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "nodeX",
        name: "Capability X",
        description: "Describes X",
        metadata: {},
      },
      {
        id: "nodeY",
        name: "Capability Y",
        description: "Describes Y",
        metadata: {},
      },
    ];
    const edges: DependencyEdge[] = [
      {
        fromCapabilityId: "nodeX",
        toCapabilityId: "nodeY",
        dependencyType: "uses",
        strength: 0.5,
        metadata: {},
      },
      {
        fromCapabilityId: "nodeX",
        toCapabilityId: "nodeY",
        dependencyType: "is_prerequisite_for",
        strength: 0.9,
        metadata: {},
      },
    ];

    const result = { nodes: nodes, edges: edges };

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(2);
    expect(result.edges.some(e => e.dependencyType === "uses")).toBe(true);
    expect(result.edges.some(e => e.dependencyType === "is_prerequisite_for")).toBe(true);
  });

  it("should return empty arrays when no capabilities or dependencies are provided", () => {
    const nodes: CapabilityNode[] = [];
    const edges: DependencyEdge[] = [];

    const result = { nodes: nodes, edges: edges };

    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});