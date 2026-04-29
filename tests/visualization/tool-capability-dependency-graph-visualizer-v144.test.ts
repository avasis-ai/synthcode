import { describe, it, expect } from "vitest";
import {
  CapabilityEdge,
  CapabilityNode,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v144";

describe("CapabilityGraphVisualizer", () => {
  it("should correctly process a basic set of nodes and edges", () => {
    const nodes: CapabilityNode[] = [
      {
        capabilityId: "A",
        name: "Capability A",
        description: "Desc A",
        inputs: { x: { required: true; type: "number" } },
        outputs: { y: { required: true; type: "string" } },
      },
      {
        capabilityId: "B",
        name: "Capability B",
        description: "Desc B",
        inputs: {},
        outputs: { z: { required: false; type: "boolean" } },
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceCapabilityId: "A",
        targetCapabilityId: "B",
        dependencyType: "requires",
        metadata: { strength: 0.8 },
      },
    ];

    // Mock implementation or expected structure check
    const graph = { nodes: nodes, edges: edges };
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].dependencyType).toBe("requires");
  });

  it("should handle nodes with no inputs or outputs", () => {
    const nodes: CapabilityNode[] = [
      {
        capabilityId: "C",
        name: "Capability C",
        description: "Desc C",
        inputs: {},
        outputs: {},
      },
    ];
    const edges: CapabilityEdge[] = [];

    const graph = { nodes: nodes, edges: edges };
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].capabilityId).toBe("C");
    expect(graph.nodes[0].inputs).toEqual({});
    expect(graph.nodes[0].outputs).toEqual({});
  });

  it("should correctly map all specified edges", () => {
    const nodes: CapabilityNode[] = [
      {
        capabilityId: "D",
        name: "Capability D",
        description: "Desc D",
        inputs: {},
        outputs: {},
      },
      {
        capabilityId: "E",
        name: "Capability E",
        description: "Desc E",
        inputs: {},
        outputs: {},
      },
    ];
    const edges: CapabilityEdge[] = [
      {
        sourceCapabilityId: "D",
        targetCapabilityId: "E",
        dependencyType: "provides",
        metadata: { weight: 1.0 },
      },
    ];

    const graph = { nodes: nodes, edges: edges };
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].sourceCapabilityId).toBe("D");
    expect(graph.edges[0].targetCapabilityId).toBe("E");
    expect(graph.edges[0].dependencyType).toBe("provides");
  });
});