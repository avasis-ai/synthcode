import { describe, it, expect } from "vitest";
import {
  CapabilityGraphPayload,
  CapabilityNode,
  DependencyEdge,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v147";

describe("CapabilityGraphPayload", () => {
  it("should correctly structure a basic graph payload", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "node1",
        name: "Node A",
        description: "Desc A",
        metadata: {},
      },
      {
        id: "node2",
        name: "Node B",
        description: "Desc B",
        metadata: {},
      },
    ];
    const edges: DependencyEdge[] = [
      {
        source: "node1",
        target: "node2",
        relationship: "uses",
        strength: 0.8,
      },
    ];
    const payload: CapabilityGraphPayload = { nodes, edges };

    expect(payload).toBeDefined();
    expect(payload.nodes).toHaveLength(2);
    expect(payload.edges).toHaveLength(1);
    expect(payload.nodes[0].id).toBe("node1");
    expect(payload.edges[0].source).toBe("node1");
  });

  it("should handle empty graph payload", () => {
    const payload: CapabilityGraphPayload = { nodes: [], edges: [] };

    expect(payload).toBeDefined();
    expect(payload.nodes).toHaveLength(0);
    expect(payload.edges).toHaveLength(0);
  });

  it("should correctly include complex metadata", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "node3",
        name: "Node C",
        description: "Desc C",
        metadata: { version: 2, owner: "teamX" },
      },
    ];
    const edges: DependencyEdge[] = [];
    const payload: CapabilityGraphPayload = { nodes: nodes, edges: edges };

    expect(payload.nodes[0].metadata).toEqual({ version: 2, owner: "teamX" });
  });
});