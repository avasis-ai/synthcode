import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraph,
  DebuggerContext,
  initializeDebuggerContext,
  processToolCall,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v138-enhanced-v134-enhanced-v3";

describe("ToolCallDependencyGraphDebugger", () => {
  it("should initialize the context correctly with a basic graph", () => {
    const graph = {
      nodes: new Map([["start", {}]]),
      edges: new Map(),
    };
    const context = initializeDebuggerContext(graph, []);
    expect(context.graph).toBe(graph);
    expect(context.history).toHaveLength(0);
  });

  it("should process a tool call and update the graph and context", () => {
    const graph = {
      nodes: new Map([["start", {}]]),
      edges: new Map(),
    };
    const context = initializeDebuggerContext(graph, []);

    const toolCall = {
      toolName: "search",
      toolInput: "vitest",
    };

    const updatedContext = processToolCall(context, toolCall);

    expect(updatedContext.graph.nodes.has("search_call")).toBe(true);
    expect(updatedContext.history).toHaveLength(1);
    expect(updatedContext.history[0].currentNodeId).toBe("search_call");
  });

  it("should handle multiple sequential tool calls correctly", () => {
    const graph = {
      nodes: new Map([["start", {}]]),
      edges: new Map(),
    };
    let context = initializeDebuggerContext(graph, []);

    // First call
    const toolCall1 = {
      toolName: "search",
      toolInput: "vitest",
    };
    context = processToolCall(context, toolCall1);

    // Second call
    const toolCall2 = {
      toolName: "read_file",
      toolInput: "package.json",
    };
    const finalContext = processToolCall(context, toolCall2);

    expect(finalContext.history).toHaveLength(2);
    expect(finalContext.history[1].currentNodeId).toBe("read_file_call");
  });
});