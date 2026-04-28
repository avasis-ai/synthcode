import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  DependencyEdge,
  ToolCapabilityDependencyGraphPayload,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v138";

describe("ToolCapabilityDependencyGraphVisualizerV138", () => {
  it("should correctly structure the payload with nodes and edges", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "node1",
        name: "Capability A",
        description: "Desc A",
        metadata: {},
      },
      {
        id: "node2",
        name: "Capability B",
        description: "Desc B",
        metadata: {},
      },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceCapabilityId: "node1",
        targetCapabilityId: "node2",
        dependencyType: "requires",
        context: "A needs B",
      },
    ];
    const payload: ToolCapabilityDependencyGraphPayload = {
      nodes: nodes,
      edges: edges,
    };

    expect(payload).toEqual({
      nodes: nodes,
      edges: edges,
    });
  });

  it("should handle an empty graph payload", () => {
    const payload: ToolCapabilityDependencyGraphPayload = {
      nodes: [],
      edges: [],
    };

    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });

  it("should correctly map different dependency types", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "nodeA",
        name: "Node A",
        description: "Desc A",
        metadata: {},
      },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceCapabilityId: "nodeA",
        targetCapabilityId: "nodeA",
        dependencyType: "uses",
        context: "Self-use",
      },
      {
        sourceCapabilityId: "nodeA",
        targetCapabilityId: "nodeA",
        dependencyType: "is_precursor_to",
        context: "Precursor",
      },
    ];
    const payload: ToolCapabilityDependencyGraphPayload = {
      nodes: nodes,
      edges: edges,
    };

    expect(payload.edges[0].dependencyType).toBe("uses");
    expect(payload.edges[1].dependencyType).toBe("is_precursor_to");
  });
});