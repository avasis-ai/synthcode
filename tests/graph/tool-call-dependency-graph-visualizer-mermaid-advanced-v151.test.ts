import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v151";

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with an empty graph", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.connections).toEqual([]);
  });

  it("should add a single start node correctly", () => {
    const graph = new ToolCallDependencyGraph();
    const startNode = { id: "start", type: "start", metadata: {}, connections: [] };
    graph.addNode(startNode);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toEqual(startNode);
  });

  it("should add connections between existing nodes", () => {
    const graph = new ToolCallDependencyGraph();
    const startNode = { id: "start", type: "start", metadata: {}, connections: [] };
    const toolCallNode = { id: "tool_call", type: "tool_call", metadata: {}, connections: [] };
    const endNode = { id: "end", type: "end", metadata: {}, connections: [] };

    graph.addNode(startNode);
    graph.addNode(toolCallNode);
    graph.addNode(endNode);

    const connection = { from: "start", to: "tool_call" };
    graph.addConnection(connection);

    expect(graph.connections).toHaveLength(1);
    expect(graph.connections[0]).toEqual(connection);
  });
});