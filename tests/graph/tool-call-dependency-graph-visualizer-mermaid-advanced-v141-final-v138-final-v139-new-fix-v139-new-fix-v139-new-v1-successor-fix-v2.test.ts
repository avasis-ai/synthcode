import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v141-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix-v2";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph = new DependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new DependencyGraph();
    const node1 = { id: "start", description: "Start", type: "start", metadata: {} };
    const node2 = { id: "process", description: "Process Step", type: "process", metadata: {} };
    const edge1 = { fromId: "start", toId: "process" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge(edge1);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes).toContainEqual(node1);
    expect(graph.edges).toContainEqual(edge1);
  });

  it("should handle updating existing nodes and edges", () => {
    const graph = new DependencyGraph();
    const node1 = { id: "start", description: "Start", type: "start", metadata: {} };
    const node2 = { id: "process", description: "Old Process", type: "process", metadata: {} };
    const edge1 = { fromId: "start", toId: "process" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge(edge1);

    // Update node 2
    const updatedNode2 = { id: "process", description: "Updated Process", type: "process", metadata: {} };
    graph.updateNode(updatedNode2);

    // Update edge 1 (assuming updateEdge handles replacement or merge)
    const updatedEdge1 = { fromId: "start", toId: "process", condition: "always" };
    graph.updateEdge(updatedEdge1);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find(n => n.id === "process")?.description).toBe("Updated Process");
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges.find(e => e.fromId === "start" && e.toId === "process")?.condition).toBe("always");
  });
});