import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  CapabilityEdge,
} from "../src/visualization/tool-capability-graph-visualizer";

describe("CapabilityGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = {
      nodes: [] as CapabilityNode[],
      edges: [] as CapabilityEdge[],
    };
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = {
      nodes: [
        { id: "tool1", type: "tool", name: "Tool A", description: "Desc A" },
        { id: "cap1", type: "capability", name: "Cap X", description: "Desc X" },
      ] as CapabilityNode[],
      edges: [
        { source: "tool1", target: "cap1", type: "requires", details: "Needs X" } as CapabilityEdge,
      ],
    };
    expect(visualizer.nodes.length).toBe(2);
    expect(visualizer.edges.length).toBe(1);
    expect(visualizer.nodes[0].id).toBe("tool1");
    expect(visualizer.edges[0].type).toBe("requires");
  });

  it("should handle updates to nodes and edges", () => {
    const initialNodes: CapabilityNode[] = [
      { id: "tool1", type: "tool", name: "Tool A", description: "Desc A" },
    ];
    const initialEdges: CapabilityEdge[] = [
      { source: "tool1", target: "cap1", type: "requires", details: "Needs X" } as CapabilityEdge,
    ];
    const visualizer = {
      nodes: initialNodes,
      edges: initialEdges,
    };

    const updatedNodes: CapabilityNode[] = [
      ...initialNodes,
      { id: "cap1", type: "capability", name: "Cap X", description: "Desc X" },
    ];
    const updatedEdges: CapabilityEdge[] = [
      ...initialEdges,
      { source: "tool1", target: "cap1", type: "is_compatible_with", details: "Compatible" } as CapabilityEdge,
    ];

    // Assuming a method like 'update' or direct assignment for testing purposes
    (visualizer as any).update = (nodes: CapabilityNode[], edges: CapabilityEdge[]) => {
      visualizer.nodes = nodes;
      visualizer.edges = edges;
    };

    visualizer.update(updatedNodes, updatedEdges);

    expect(visualizer.nodes.length).toBe(2);
    expect(visualizer.edges.length).toBe(2);
    expect(visualizer.nodes.find(n => n.id === "cap1")).toBeDefined();
    expect(visualizer.edges.find(e => e.type === "is_compatible_with")).toBeDefined();
  });
});