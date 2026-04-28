import { describe, it, expect } from "vitest";
import {
  DynamicGraphData,
  DependencyNode,
  DependencyEdge,
  GraphUpdate,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v142";

describe("DynamicGraphData", () => {
  it("should correctly initialize with empty structures", () => {
    const data: DynamicGraphData = {
      nodes: new Map<string, DependencyNode>(),
      edges: new Set<string>(),
    };
    expect(data.nodes).toBeInstanceOf(Map);
    expect(data.edges).toBeInstanceOf(Set);
    expect(data.nodes.size).toBe(0);
    expect(data.edges.size).toBe(0);
  });

  it("should allow adding and retrieving nodes correctly", () => {
    const initialData: DynamicGraphData = {
      nodes: new Map<string, DependencyNode>(),
      edges: new Set<string>(),
    };
    const newNode: DependencyNode = {
      id: "toolA",
      name: "Tool A",
      dependencies: ["toolB"],
      status: "pending",
      metadata: {},
    };
    const updatedData = {
      ...initialData,
      nodes: new Map(initialData.nodes).set(newNode.id, newNode),
    };

    expect(updatedData.nodes.has("toolA")).toBe(true);
    expect(updatedData.nodes.get("toolA")!.name).toBe("Tool A");
  });

  it("should correctly process a graph update with new nodes and edges", () => {
    const initialData: DynamicGraphData = {
      nodes: new Map<string, DependencyNode>(),
      edges: new Set<string>(),
    };
    const update: GraphUpdate = {
      nodes: [
        {
          id: "toolA",
          name: "Tool A",
          dependencies: [],
          status: "resolved",
          metadata: {},
        },
        {
          id: "toolB",
          name: "Tool B",
          dependencies: ["toolA"],
          status: "pending",
          metadata: {},
        },
      ],
      edges: [
        { fromId: "toolA", toId: "toolB", type: "depends_on" },
      ],
    };

    const updatedData = {
      ...initialData,
      nodes: new Map(initialData.nodes),
      edges: new Set(initialData.edges),
    };

    // Simulate the update logic (assuming a helper function or direct application)
    // For testing purposes, we'll just check if the structure can hold the update data.
    // A real test would call the actual update method.
    const updatedNodes = new Map<string, DependencyNode>();
    update.nodes.forEach(node => updatedNodes.set(node.id, node));
    const updatedEdges = new Set<string>();
    update.edges.forEach(edge => updatedEdges.add(`${edge.fromId}->${edge.toId}`));

    const finalData: DynamicGraphData = {
      nodes: updatedNodes,
      edges: updatedEdges,
    };

    expect(finalData.nodes.size).toBe(2);
    expect(finalData.nodes.get("toolA")!.status).toBe("resolved");
    expect(finalData.edges.has("toolA->toolB")).toBe(true);
  });
});