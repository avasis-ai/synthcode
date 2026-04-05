import { describe, it, expect } from "vitest";
import {
  DependencyGraph,
  GraphNode,
  FlowControlNode,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v6";

describe("DependencyGraph", () => {
  it("should correctly structure a simple linear dependency graph", () => {
    const graph: DependencyGraph = {
      nodes: [
        {
          id: "user_msg_1",
          type: "user",
          message: { role: "user", content: "Hello" },
          contentBlocks: [{ type: "text", content: "Hello" }],
        },
        {
          id: "assistant_msg_1",
          type: "assistant",
          message: { role: "assistant", content: "Hi there" },
          contentBlocks: [{ type: "text", content: "Hi there" }],
        },
      ],
      edges: [
        { source: "user_msg_1", target: "assistant_msg_1" },
      ],
    };

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].source).toBe("user_msg_1");
    expect(graph.edges[0].target).toBe("assistant_msg_1");
  });

  it("should handle a graph with tool use and branching logic", () => {
    const graph: DependencyGraph = {
      nodes: [
        {
          id: "user_msg_1",
          type: "user",
          message: { role: "user", content: "What is the weather?" },
          contentBlocks: [{ type: "text", content: "What is the weather?" }],
        },
        {
          id: "assistant_tool_call",
          type: "assistant",
          message: { role: "assistant", content: "Tool call" },
          contentBlocks: [{ type: "tool_use", content: "weather_api" }],
        },
        {
          id: "tool_result_1",
          type: "tool",
          message: { role: "tool", content: "Result" },
          contentBlocks: [{ type: "text", content: "Sunny" }],
        },
        {
          id: "flow_control_1",
          type: "flowcontrol",
          description: "Weather check complete",
          branches: [{ condition: "sunny", nextNodeId: "final_response" }],
        },
        {
          id: "final_response",
          type: "assistant",
          message: { role: "assistant", content: "It is sunny" },
          contentBlocks: [{ type: "text", content: "It is sunny" }],
        },
      ],
      edges: [
        { source: "user_msg_1", target: "assistant_tool_call" },
        { source: "assistant_tool_call", target: "tool_result_1" },
        { source: "tool_result_1", target: "flow_control_1" },
        { source: "flow_control_1", target: "final_response", condition: "sunny" },
      ],
    };

    expect(graph.nodes.some(n => n.id === "flow_control_1" && n.type === "flowcontrol")).toBe(true);
    expect(graph.edges.length).toBe(4);
    const flowEdge = graph.edges.find(e => e.source === "flow_control_1");
    expect(flowEdge?.condition).toBe("sunny");
  });

  it("should handle an empty graph", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});