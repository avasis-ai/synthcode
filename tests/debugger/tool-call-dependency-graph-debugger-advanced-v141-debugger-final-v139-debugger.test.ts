import { describe, it, expect } from "vitest";
import { GraphState, GraphNode, GraphEdge } from "../debugger/tool-call-dependency-graph-debugger-advanced-v141-debugger-final-v139-debugger";

describe("GraphState", () => {
  it("should initialize with an empty map for nodes", () => {
    const state = new GraphState();
    expect(state.nodes.size).toBe(0);
  });

  it("should add a node correctly", () => {
    const state = new GraphState();
    const newNode: GraphNode = { id: "node1", type: "user", data: {} };
    state.addNode(newNode);
    expect(state.nodes.has("node1")).toBe(true);
    expect(state.nodes.get("node1")).toEqual(newNode);
  });

  it("should add an edge correctly", () => {
    const state = new GraphState();
    const nodeA: GraphNode = { id: "nodeA", type: "user", data: {} };
    const nodeB: GraphNode = { id: "nodeB", type: "assistant", data: {} };
    state.addNode(nodeA);
    state.addNode(nodeB);

    const newEdge: GraphEdge = { id: "edge1", from: "nodeA", to: "nodeB", type: "call" };
    state.addEdge(newEdge);
    expect(state.edges.has("edge1")).toBe(true);
    expect(state.edges.get("edge1")).toEqual(newEdge);
  });
});