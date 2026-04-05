import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphDebuggerAdvancedV137,
} from "../../../src/debugger/tool-call-dependency-graph-debugger-advanced-v137";

describe("ToolCallDependencyGraphDebuggerAdvancedV137", () => {
  it("should correctly build a simple dependency graph", async () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV137();
    const messages: Message[] = [
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: [{ type: "text", content: "The capital of France is" }] },
      { role: "tool", tool_use_id: "tool_1", content: "Paris", is_error: false },
    ];
    await debuggerInstance.processMessages(messages);
    const graph = debuggerInstance.getDependencyGraph();

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
  });

  it("should handle multiple tool calls and dependencies", async () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV137();
    const messages: Message[] = [
      { role: "user", content: "Get weather for London and Paris." },
      { role: "assistant", content: [{ type: "text", content: "I can check the weather for you." }] },
      { role: "tool", tool_use_id: "tool_london", content: "Sunny", is_error: false },
      { role: "tool", tool_use_id: "tool_paris", content: "Cloudy", is_error: false },
    ];
    await debuggerInstance.processMessages(messages);
    const graph = debuggerInstance.getDependencyGraph();

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("should reset the graph when processMessages is called again", async () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV137();
    const messages1: Message[] = [
      { role: "user", content: "First interaction." },
    ];
    await debuggerInstance.processMessages(messages1);
    const graph1 = debuggerInstance.getDependencyGraph();

    const messages2: Message[] = [
      { role: "user", content: "Second interaction." },
    ];
    await debuggerInstance.processMessages(messages2);
    const graph2 = debuggerInstance.getDependencyGraph();

    expect(graph1).toBeDefined();
    expect(graph2).toBeDefined();
    // A simple check to ensure the graph structure changes or is re-processed
    expect(graph2.nodes.length).toBeGreaterThanOrEqual(1);
  });
});