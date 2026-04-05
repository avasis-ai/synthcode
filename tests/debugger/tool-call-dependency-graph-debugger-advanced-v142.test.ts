import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v142";

describe("ToolCallDependencyGraph", () => {
  it("should initialize with empty structures", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual({});
    expect(graph.executionState).toEqual({
      currentNodeId: null,
      currentEdgeId: null,
      history: [],
      variables: {},
    });
  });

  it("should add nodes and edges correctly", () => {
    const graph = new ToolCallDependencyGraph();
    graph.addNode("node1", { type: "user", content: "initial prompt" });
    graph.addNode("node2", { type: "assistant", content: "tool call" });
    graph.addEdge("edge1", "node1", "node2", { toolName: "search" });

    expect(graph.nodes).toHaveProperty("node1");
    expect(graph.nodes).toHaveProperty("node2");
    expect(graph.edges).toHaveProperty("edge1");
    expect(graph.edges["edge1"].source).toBe("node1");
    expect(graph.edges["edge1"].target).toBe("node2");
  });

  it("should update execution state correctly after processing a step", () => {
    const graph = new ToolCallDependencyGraph();
    graph.addNode("start", { type: "system", content: "Start" });
    graph.addNode("tool_call", { type: "tool_use", content: "tool_use_data" });
    graph.addEdge("step1", "start", "tool_call", { toolName: "search" });

    // Simulate moving to the tool call node
    graph.updateExecutionState("step1", "tool_call");

    expect(graph.executionState.currentNodeId).toBe("tool_call");
    expect(graph.executionState.currentEdgeId).toBe("step1");
    expect(graph.executionState.history).toHaveLength(1);
    expect(graph.executionState.history[0].nodeId).toBe("tool_call");
    expect(graph.executionState.history[0].edgeId).toBe("step1");
  });
});