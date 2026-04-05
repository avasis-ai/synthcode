import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraph,
  GraphNode,
  GraphEdge,
} from "../debugger-context-types"; // Assuming the types are exported from here or a similar location

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with empty maps", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new ToolCallDependencyGraph();
    const node1: GraphNode = {
      id: "n1",
      type: "tool_call",
      inputs: {},
      outputs: {},
      metadata: {},
    };
    const node2: GraphNode = {
      id: "n2",
      type: "user_input",
      inputs: {},
      outputs: {},
      metadata: {},
    };

    graph.addNode(node1);
    graph.addNode(node2);

    const edge1: GraphEdge = {
      fromNodeId: "n1",
      toNodeId: "n2",
      condition: "success",
      weight: 1.0,
    };
    graph.addEdge(edge1);

    expect(graph.nodes.has("n1")).toBe(true);
    expect(graph.nodes.has("n2")).toBe(true);
    expect(graph.edges.has("n1_n2")).toBe(true);
  });

  it("should handle updating existing nodes and edges", () => {
    const graph = new ToolCallDependencyGraph();
    const node1: GraphNode = {
      id: "n1",
      type: "tool_call",
      inputs: { query: "initial" },
      outputs: {},
      metadata: {},
    };
    graph.addNode(node1);

    const edge1: GraphEdge = {
      fromNodeId: "n1",
      toNodeId: "n2",
      condition: "success",
      weight: 1.0,
    };
    graph.addEdge(edge1);

    // Update node
    const updatedNode1: GraphNode = {
      id: "n1",
      type: "tool_call",
      inputs: { query: "updated" },
      outputs: { result: "data" },
      metadata: { version: 2 },
    };
    graph.updateNode(updatedNode1);

    // Update edge (assuming an update method exists or we re-add/overwrite)
    const updatedEdge1: GraphEdge = {
      fromNodeId: "n1",
      toNodeId: "n2",
      condition: "success",
      weight: 1.5,
    };
    // Assuming addEdge handles updates or we use a specific update method
    graph.addEdge(updatedEdge1);

    // Check updates (This assumes the implementation correctly overwrites/merges)
    const retrievedNode = graph.nodes.get("n1");
    expect(retrievedNode?.inputs).toEqual({ query: "updated" });
    expect(retrievedNode?.outputs).toEqual({ result: "data" });

    const retrievedEdge = graph.edges.get("n1_n2");
    expect(retrievedEdge?.weight).toBe(1.5);
  });
});