import { describe, it, expect } from "vitest";
import { CapabilityGraphBuilder } from "../src/visualization/capability-dependency-graph-visualizer";
import { CapabilityRegistry } from "../src/registry/capability-registry";

describe("CapabilityGraphBuilder", () => {
  it("should build a graph from a populated registry", () => {
    const mockRegistry = {
      getCapabilities: () => [
        { id: "A", name: "CapA", description: "DescA" },
        { id: "B", name: "CapB", description: "DescB" },
      ],
      getDependencies: () => [
        { sourceId: "A", targetId: "B", relationship: "requires", description: "A needs B" },
      ],
    } as unknown as CapabilityRegistry;

    const builder = new CapabilityGraphBuilder(mockRegistry);
    const graph = builder.buildGraph();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes.some(node => node.id === "A" && node.name === "CapA")).toBe(true);
    expect(graph.edges[0].sourceCapabilityId).toBe("A");
    expect(graph.edges[0].targetCapabilityId).toBe("B");
  });

  it("should return an empty graph if the registry is empty", () => {
    const mockRegistry = {
      getCapabilities: () => [],
      getDependencies: () => [],
    } as unknown as CapabilityRegistry;

    const builder = new CapabilityGraphBuilder(mockRegistry);
    const graph = builder.buildGraph();

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly map all nodes and edges", () => {
    const mockRegistry = {
      getCapabilities: () => [
        { id: "C1", name: "Cap1", description: "Desc1" },
        { id: "C2", name: "Cap2", description: "Desc2" },
        { id: "C3", name: "Cap3", description: "Desc3" },
      ],
      getDependencies: () => [
        { sourceId: "C1", targetId: "C2", relationship: "requires", description: "C1 -> C2" },
        { sourceId: "C2", targetId: "C3", relationship: "requires", description: "C2 -> C3" },
      ],
    } as unknown as CapabilityRegistry;

    const builder = new CapabilityGraphBuilder(mockRegistry);
    const graph = builder.buildGraph();

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toEqual(expect.arrayContaining([
      { sourceCapabilityId: "C1", targetCapabilityId: "C2", relationship: "requires", description: "C1 -> C2" },
      { sourceCapabilityId: "C2", targetCapabilityId: "C3", relationship: "requires", description: "C2 -> C3" },
    ]));
  });
});