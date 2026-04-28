import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  CapabilityEdge,
  CapabilityGraphPayload,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v139";

describe("CapabilityGraphPayload", () => {
  it("should correctly construct a basic graph payload", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "node1",
        name: "Node One",
        description: "Desc 1",
        requiredCapabilities: ["capA"],
      },
      {
        id: "node2",
        name: "Node Two",
        description: "Desc 2",
        requiredCapabilities: ["capB"],
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceId: "node1",
        targetId: "node2",
        dependencyType: "requires",
        details: "Requires B",
      },
    ];
    const payload: CapabilityGraphPayload = { nodes, edges };

    expect(payload).toHaveProperty("nodes");
    expect(payload).toHaveProperty("edges");
    expect(payload.nodes.length).toBe(2);
    expect(payload.edges.length).toBe(1);
  });

  it("should handle empty graph payload", () => {
    const payload: CapabilityGraphPayload = { nodes: [], edges: [] };
    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });

  it("should correctly include various dependency types in edges", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "n1",
        name: "N1",
        description: "D1",
        requiredCapabilities: [],
      },
      {
        id: "n2",
        name: "N2",
        description: "D2",
        requiredCapabilities: [],
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceId: "n1",
        targetId: "n2",
        dependencyType: "requires",
        details: "Requires",
      },
      {
        sourceId: "n2",
        targetId: "n1",
        dependencyType: "conflicts_with",
        details: "Conflicts",
      },
      {
        sourceId: "n1",
        targetId: "n2",
        dependencyType: "compatible_with",
        details: "Compatible",
      },
    ];
    const payload: CapabilityGraphPayload = { nodes: nodes, edges: edges };

    expect(payload.edges[0].dependencyType).toBe("requires");
    expect(payload.edges[1].dependencyType).toBe("conflicts_with");
    expect(payload.edges[2].dependencyType).toBe("compatible_with");
  });
});