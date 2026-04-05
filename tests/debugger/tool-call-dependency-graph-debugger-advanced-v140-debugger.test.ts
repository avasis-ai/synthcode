import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphDebuggerAdvancedV140Debugger,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v140-debugger";

describe("ToolCallDependencyGraphDebuggerAdvancedV140Debugger", () => {
  it("should correctly build a simple dependency graph", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV140Debugger();
    const messages: Message[] = [
      { role: "user", content: "What is the capital of France?" },
      {
        role: "assistant",
        content: [
          { type: "text", content: "The capital of France is " },
          { type: "tool_use", tool_call_id: "tool_1", name: "get_capital", input: "France" },
        ],
      },
      {
        role: "tool",
        tool_use_id: "tool_1",
        content: "Paris",
      },
    ];
    debuggerInstance.processMessages(messages);
    const graph = debuggerInstance.getDependencyGraph();

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBe(3); // User, Assistant, Tool
    expect(graph.edges.length).toBe(2); // User -> Assistant, Assistant -> Tool
  });

  it("should handle multiple tool calls and dependencies", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV140Debugger();
    const messages: Message[] = [
      { role: "user", content: "What is the weather in London and Paris?" },
      {
        role: "assistant",
        content: [
          { type: "text", content: "I need to check the weather for two cities: " },
          { type: "tool_use", tool_call_id: "tool_1", name: "get_weather", input: "London" },
          { type: "tool_use", tool_call_id: "tool_2", name: "get_weather", input: "Paris" },
        ],
      },
      {
        role: "tool",
        tool_use_id: "tool_1",
        content: "Sunny",
      },
      {
        role: "tool",
        tool_use_id: "tool_2",
        content: "Cloudy",
      },
    ];
    debuggerInstance.processMessages(messages);
    const graph = debuggerInstance.getDependencyGraph();

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBe(4); // User, Assistant, Tool1, Tool2
    expect(graph.edges.length).toBe(3); // User -> Assistant, Assistant -> Tool1, Assistant -> Tool2
  });

  it("should maintain correct state when processing messages sequentially", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV140Debugger();
    const messages: Message[] = [
      { role: "user", content: "First question." },
    ];
    debuggerInstance.processMessages(messages);
    let graph = debuggerInstance.getDependencyGraph();
    expect(graph.nodes.length).toBe(1);

    const messages2: Message[] = [
      {
        role: "assistant",
        content: [
          { type: "text", content: "Answer 1: " },
          { type: "tool_use", tool_call_id: "tool_a", name: "tool_a", input: "data_a" },
        ],
      },
      {
        role: "tool",
        tool_use_id: "tool_a",
        content: "Result A",
      },
    ];
    debuggerInstance.processMessages(messages2);
    graph = debuggerInstance.getDependencyGraph();
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
  });
});