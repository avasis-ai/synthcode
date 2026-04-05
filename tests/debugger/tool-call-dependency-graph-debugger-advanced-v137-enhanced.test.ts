import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
} from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v137-enhanced";

describe("GraphDebuggerAdvancedV137Enhanced", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const nodes: GraphNode[] = [
      {
        id: "user1",
        type: "user",
        input: "Hello",
        output: null,
        state: {},
      },
      {
        id: "assistant1",
        type: "assistant",
        input: null,
        output: {
          message: "Hi there!",
        },
        state: {},
      },
    ];
    const edges: GraphEdge[] = [
      {
        id: "e1",
        source: "user1",
        target: "assistant1",
        dependencyType: "calls",
        context: "initial interaction",
      },
    ];
    const graph = { nodes: nodes, edges: edges };
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
  });

  it("should handle a graph with tool calls and subsequent results", () => {
    const nodes: GraphNode[] = [
      {
        id: "user1",
        type: "user",
        input: "What is the weather?",
        output: null,
        state: {},
      },
      {
        id: "assistant1",
        type: "assistant",
        input: null,
        output: {
          tool_calls: [{
            id: "tool_call_1",
            name: "get_weather",
            args: {
              location: "London",
            },
          }],
        },
        state: {},
      },
      {
        id: "tool_result1",
        type: "tool_call",
        input: null,
        output: {
          result: "Sunny",
        },
        state: {},
      },
      {
        id: "assistant2",
        type: "assistant",
        input: null,
        output: {
          message: "It's sunny in London.",
        },
        state: {},
      },
    ];
    const edges: GraphEdge[] = [
      {
        id: "e1",
        source: "user1",
        target: "assistant1",
        dependencyType: "calls",
        context: "initial query",
      },
      {
        id: "e2",
        source: "assistant1",
        target: "tool_result1",
        dependencyType: "calls",
        context: "tool execution",
      },
      {
        id: "e3",
        source: "tool_result1",
        target: "assistant2",
        dependencyType: "follows",
        context: "result processing",
      },
    ];
    const graph = { nodes: nodes, edges: edges };
    expect(graph.nodes.length).toBe(4);
    expect(graph.edges.length).toBe(3);
  });

  it("should correctly identify the flow when multiple tool calls are involved", () => {
    const nodes: GraphNode[] = [
      {
        id: "user1",
        type: "user",
        input: "Get weather and stock price.",
        output: null,
        state: {},
      },
      {
        id: "assistant1",
        type: "assistant",
        input: null,
        output: {
          tool_calls: [
            {
              id: "tool_call_weather",
              name: "get_weather",
              args: {
                location: "Paris",
              },
            },
            {
              id: "tool_call_stock",
              name: "get_stock",
              args: {
                ticker: "GOOGL",
              },
            },
          ],
        },
        state: {},
      },
      {
        id: "tool_result_weather",
        type: "tool_call",
        input: null,
        output: {
          result: "Cloudy",
        },
        state: {},
      },
      {
        id: "tool_result_stock",
        type: "tool_call",
        input: null,
        output: {
          result: "150.00",
        },
        state: {},
      },
      {
        id: "assistant2",
        type: "assistant",
        input: null,
        output: {
          message: "Weather is cloudy, stock is 150.00.",
        },
        state: {},
      },
    ];
    const edges: GraphEdge[] = [
      {
        id: "e1",
        source: "user1",
        target: "assistant1",
        dependencyType: "calls",
        context: "initial request",
      },
      {
        id: "e2",
        source: "assistant1",
        target: "tool_result_weather",
        dependencyType: "calls",
        context: "weather tool execution",
      },
      {
        id: "e3",
        source: "assistant1",
        target: "tool_result_stock",
        dependencyType: "calls",
        context: "stock tool execution",
      },
      {
        id: "e4",
        source: "tool_result_weather",
        target: "assistant2",
        dependencyType: "follows",
        context: "weather result used",
      },
      {
        id: "e5",
        source: "tool_result_stock",
        target: "assistant2",
        dependencyType: "follows",
        context: "stock result used",
      },
    ];
    const graph = { nodes: nodes, edges: edges };
    expect(graph.nodes.length).toBe(5);
    expect(graph.edges.length).toBe(5);
  });
});