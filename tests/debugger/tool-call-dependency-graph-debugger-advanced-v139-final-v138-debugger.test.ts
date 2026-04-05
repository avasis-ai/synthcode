import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphDebuggerAdvancedV139FinalV138Debugger,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v139-final-v138-debugger";

describe("ToolCallDependencyGraphDebuggerAdvancedV139FinalV138Debugger", () => {
  it("should correctly build a simple dependency graph", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV139FinalV138Debugger();
    const messages = [
      { role: "user", content: [{ type: "text", text: "What is the weather?" }] },
      { role: "assistant", content: [{ type: "tool_use", id: "tool_1", name: "get_weather", input: { location: "Tokyo" } }] },
      { role: "tool", content: [{ type: "tool_result", tool_call_id: "tool_1", content: { result: "Sunny" } }] },
      { role: "assistant", content: [{ type: "text", text: "The weather in Tokyo is Sunny." }] },
    ];
    const graph = debuggerInstance.buildGraph(messages);

    expect(graph).toBeDefined();
    expect(graph.dependencies).toHaveLength(1);
    expect(graph.dependencies[0].fromId).toBe("tool_1");
    expect(graph.dependencies[0].toId).toBe("text_2");
  });

  it("should handle multiple tool calls and dependencies", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV139FinalV138Debugger();
    const messages = [
      { role: "user", content: [{ type: "text", text: "Get weather for London and get time in Paris." }] },
      { role: "assistant", content: [{ type: "tool_use", id: "tool_1", name: "get_weather", input: { location: "London" } }, { type: "tool_use", id: "tool_2", name: "get_time", input: { city: "Paris" } }] },
      { role: "tool", content: [{ type: "tool_result", tool_call_id: "tool_1", content: { result: "Cloudy" } }] },
      { role: "tool", content: [{ type: "tool_result", tool_call_id: "tool_2", content: { result: "10:00 AM" } }] },
      { role: "assistant", content: [{ type: "text", text: "Weather in London: Cloudy, Time in Paris: 10:00 AM." }] },
    ];
    const graph = debuggerInstance.buildGraph(messages);

    expect(graph).toBeDefined();
    expect(graph.dependencies).toHaveLength(2);
    // Check if both dependencies are present (order might vary, so check content)
    const fromIds = graph.dependencies.map(d => d.fromId);
    const toIds = graph.dependencies.map(d => d.toId);
    expect(fromIds).toEqual(expect.arrayContaining(["tool_1", "tool_2"]));
    expect(toIds).toEqual(expect.arrayContaining(["tool_1", "tool_2"]));
  });

  it("should return an empty graph for messages without tool interactions", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV139FinalV138Debugger();
    const messages = [
      { role: "user", content: [{ type: "text", text: "Hello world." }] },
      { role: "assistant", content: [{ type: "text", text: "Hello there!" }] },
    ];
    const graph = debuggerInstance.buildGraph(messages);

    expect(graph).toBeDefined();
    expect(graph.dependencies).toHaveLength(0);
  });
});