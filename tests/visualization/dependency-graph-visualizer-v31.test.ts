import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/visualization/dependency-graph-visualizer-v31";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty data", () => {
    const graph = new DependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new DependencyGraph();
    const node1 = { id: "n1", name: "Node 1", duration: 10, requiredResources: { "cpu": 1 } };
    const node2 = { id: "n2", name: "Node 2", duration: 20, requiredResources: { "memory": 2 } };
    const edge1 = { sourceId: "n1", targetId: "n2", timeWindowStart: 0, timeWindowEnd: 10, requiredResources: { "cpu": 1 } };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge(edge1);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes).toContainEqual(node1);
    expect(graph.edges).toContainEqual(edge1);
  });

  it("should handle adding duplicate nodes gracefully (or update if implemented)", () => {
    const graph = new DependencyGraph();
    const node = { id: "n1", name: "Node 1", duration: 10, requiredResources: { "cpu": 1 } };
    graph.addNode(node);
    // Assuming addNode might overwrite or ignore duplicates based on ID
    graph.addNode({ id: "n1", name: "Updated Node 1", duration: 15, requiredResources: { "cpu": 2 } });

    expect(graph.nodes).toHaveLength(1);
    // Check if the update logic was applied (assuming it updates the node)
    expect(graph.nodes[0].name).toBe("Updated Node 1");
    expect(graph.nodes[0].duration).toBe(15);
  });
});