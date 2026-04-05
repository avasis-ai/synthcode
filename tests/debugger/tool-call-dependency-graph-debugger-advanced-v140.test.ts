import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v140";

describe("ToolCallDependencyGraph", () => {
  it("should initialize with empty nodes and edges", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.getNodes().size).toBe(0);
    expect(graph.getEdges().size).toBe(0);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new ToolCallDependencyGraph();
    const nodeA = { id: "A", type: "tool_call", input: {} };
    const nodeB = { id: "B", type: "reasoning", input: {} };

    graph.addNode(nodeA);
    graph.addNode(nodeB);

    graph.addEdge("A", "B", 1.0);

    expect(graph.getNodes().size).toBe(2);
    expect(graph.getEdges().size).toBe(1);
    expect(graph.getNode("A")).toEqual(nodeA);
    expect(graph.getEdge("A", "B")).toEqual({ from: "A", to: "B", weight: 1.0 });
  });

  it("should correctly calculate dependencies after adding nodes and edges", () => {
    const graph = new ToolCallDependencyGraph();
    const nodeA = { id: "A", type: "tool_call", input: {} };
    const nodeB = { id: "B", type: "reasoning", input: {} };
    const nodeC = { id: "C", type: "tool_call", input: {} };

    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addNode(nodeC);

    graph.addEdge("A", "B", 1.0);
    graph.addEdge("B", "C", 0.5);

    const dependencies = graph.getDependencies("A");
    expect(dependencies).toEqual(["B"]);
  });
});