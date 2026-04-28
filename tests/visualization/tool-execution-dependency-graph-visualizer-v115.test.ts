import { describe, it, expect } from "vitest";
import { DependencyGraphData } from "../src/visualization/tool-execution-dependency-graph-visualizer-v115";

describe("DependencyGraphData", () => {
  it("should correctly initialize with empty data structures", () => {
    const data: DependencyGraphData = {
      nodes: {},
      edges: [],
    };
    expect(data.nodes).toEqual({});
    expect(data.edges).toEqual([]);
  });

  it("should correctly add a node with basic metadata", () => {
    const data: DependencyGraphData = {
      nodes: {
        "node1": {
          nodeId: "node1",
          startTime: 100,
          endTime: 200,
          resourcesUsed: { cpu: 0.5, memory: 1024 },
        },
      },
      edges: [],
    };
    expect(data.nodes["node1"].nodeId).toBe("node1");
    expect(data.nodes["node1"].startTime).toBe(100);
    expect(data.nodes["node1"].resourcesUsed.cpu).toBe(0.5);
  });

  it("should correctly add an edge between two nodes", () => {
    const data: DependencyGraphData = {
      nodes: {
        "nodeA": {
          nodeId: "nodeA",
          startTime: 0,
          endTime: 100,
          resourcesUsed: {},
        },
        "nodeB": {
          nodeId: "nodeB",
          startTime: 50,
          endTime: 150,
          resourcesUsed: {},
        },
      },
      edges: [
        {
          sourceId: "nodeA",
          targetId: "nodeB",
          duration: 50,
          resourceBottleneck: "cpu",
          saturationLevel: 0.8,
        },
      ],
    };
    expect(data.edges.length).toBe(1);
    expect(data.edges[0].sourceId).toBe("nodeA");
    expect(data.edges[0].targetId).toBe("nodeB");
    expect(data.edges[0].saturationLevel).toBe(0.8);
  });
});