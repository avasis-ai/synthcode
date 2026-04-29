import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  CapabilityEdge,
  DependencyGraphData,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v145";

describe("DependencyGraphData", () => {
  it("should correctly structure nodes and edges for a simple dependency", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "nodeA",
        name: "Node A",
        description: "Description A",
        metadata: {},
      },
      {
        id: "nodeB",
        name: "Node B",
        description: "Description B",
        metadata: {},
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceId: "nodeA",
        targetId: "nodeB",
        relationship: "DEPENDS_ON",
        payload: {},
        metadata: {},
      },
    ];
    const data: DependencyGraphData = { nodes, edges };

    expect(data.nodes).toHaveLength(2);
    expect(data.edges).toHaveLength(1);
    expect(data.nodes[0].id).toBe("nodeA");
    expect(data.edges[0].sourceId).toBe("nodeA");
    expect(data.edges[0].targetId).toBe("nodeB");
  });

  it("should handle an empty graph structure", () => {
    const data: DependencyGraphData = { nodes: [], edges: [] };
    expect(data.nodes).toEqual([]);
    expect(data.edges).toEqual([]);
  });

  it("should correctly include metadata in nodes and edges", () => {
    const nodes: CapabilityNode[] = [
      {
        id: "nodeX",
        name: "Node X",
        description: "Desc X",
        metadata: { version: "1.0" },
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceId: "nodeX",
        targetId: "nodeY",
        relationship: "USES",
        payload: { weight: 0.5 },
        metadata: { priority: "high" },
      },
    ];
    const data: DependencyGraphData = { nodes, edges };

    expect(data.nodes[0].metadata).toEqual({ version: "1.0" });
    expect(data.edges[0].metadata).toEqual({ priority: "high" });
    expect(data.edges[0].payload).toEqual({ weight: 0.5 });
  });
});