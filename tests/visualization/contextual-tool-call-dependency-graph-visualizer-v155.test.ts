import { describe, it, expect } from "vitest";
import {
  ContextualToolCall,
  DependencyEdge,
  DependencyGraph,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v155";

describe("ContextualToolCallDependencyGraphVisualizerV155", () => {
  it("should correctly build a basic dependency graph from tool calls", () => {
    const toolCalls: ContextualToolCall[] = [
      {
        tool_call_id: "call1",
        tool_name: "search",
        input: { query: "weather" },
      },
      {
        tool_call_id: "call2",
        tool_name: "get_current_time",
        input: {},
      },
    ];
    const graph = new DependencyGraph(toolCalls);
    expect(graph.getEdges().length).toBe(0);
    expect(graph.getNodes().length).toBe(2);
  });

  it("should establish dependencies when tool calls reference each other's outputs", () => {
    const toolCalls: ContextualToolCall[] = [
      {
        tool_call_id: "callA",
        tool_name: "search",
        input: { query: "latest news" },
      },
      {
        tool_call_id: "callB",
        tool_name: "summarize",
        input: { source_id: "callA" },
      },
    ];
    const graph = new DependencyGraph(toolCalls);
    expect(graph.getEdges().length).toBe(1);
    const edge = graph.getEdges()[0];
    expect(edge.source).toBe("callA");
    expect(edge.target).toBe("callB");
  });

  it("should handle graphs with no explicit dependencies", () => {
    const toolCalls: ContextualToolCall[] = [
      {
        tool_call_id: "call1",
        tool_name: "tool1",
        input: { param1: "value1" },
      },
      {
        tool_call_id: "call2",
        tool_name: "tool2",
        input: { param2: "value2" },
      },
    ];
    const graph = new DependencyGraph(toolCalls);
    expect(graph.getEdges().length).toBe(0);
    expect(graph.getNodes().length).toBe(2);
  });
});