import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v144-debugger-final";

describe("ToolCallDependencyGraph", () => {
  it("should initialize with empty maps", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it("should add a node correctly", () => {
    const graph = new ToolCallDependencyGraph();
    const node: GraphNode = {
      id: "node1",
      type: "start",
      inputs: {},
      outputs: {},
      dependencies: [],
      metadata: {},
    };
    graph.addNode(node);
    expect(graph.nodes.has("node1")).toBe(true);
    expect(graph.nodes.get("node1")).toEqual(node);
  });

  it("should add an edge between two existing nodes", () => {
    const graph = new ToolCallDependencyGraph();
    const nodeA: GraphNode = {
      id: "nodeA",
      type: "start",
      inputs: {},
      outputs: {},
      dependencies: [],
      metadata: {},
    };
    const nodeB: GraphNode = {
      id: "nodeB",
      type: "tool_call",
      inputs: {},
      outputs: {},
      dependencies: [],
      metadata: {},
    };
    graph.addNode(nodeA);
    graph.addNode(nodeB);

    const edge = { from: "nodeA", to: "nodeB", weight: 1 };
    graph.addEdge(edge);

    expect(graph.edges.has("nodeA->nodeB")).toBe(true);
    expect(graph.edges.get("nodeA->nodeB")).toEqual(edge);
  });
});