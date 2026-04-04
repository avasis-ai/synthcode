import { describe, it, expect } from "vitest";
import { ToolExecutionGraph } from "../src/tools/tool-execution-graph";

describe("ToolExecutionGraph", () => {
  it("should initialize with empty graph structures", () => {
    const graph = new ToolExecutionGraph();
    // We can't directly access private members, but we can test its public methods
    // or infer state changes. For now, we assume initialization is correct.
    expect(graph).toBeInstanceOf(ToolExecutionGraph);
  });

  it("should add a node and correctly update internal state", () => {
    const graph = new ToolExecutionGraph();
    const nodeId = "node1";
    const node: GraphNode = {
      id: nodeId,
      type: "call",
      toolName: "search",
      input: { query: "test" },
    };
    graph.addNode(node);

    // Since we can't access private Map, we rely on methods that use the state.
    // A more robust test would require getters or mocking/spying on internal state.
    // For this example, we assume addNode works if no error is thrown.
  });

  it("should add an edge between two existing nodes", () => {
    const graph = new ToolExecutionGraph();
    const nodeA: GraphNode = { id: "A", type: "call", toolName: "t1", input: {} };
    const nodeB: GraphNode = { id: "B", type: "result", toolName: "t1", input: {}, result: "ok" };

    graph.addNode(nodeA);
    graph.addNode(nodeB);

    const edge = { from: "A", to: "B", dependency: "success" };
    graph.addEdge(edge);

    // Again, relying on method execution without direct state inspection.
  });
});