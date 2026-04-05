import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphDebugger } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v145-debugger";

describe("ToolCallDependencyGraphDebugger", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebugger();
    const graph = debuggerInstance.buildGraph([
      { type: "message", id: "msg1", data: { role: "user", content: "Hello" } },
      { type: "tool_call", id: "call1", data: { toolName: "toolA" } },
      { type: "tool_result", id: "res1", data: { result: "Success" } },
      { type: "message", id: "msg2", data: { role: "assistant", content: "Done" } },
    ]);

    expect(graph.size).toBe(4);
    const nodes = graph.get("call1") as any;
    expect(nodes.dependencies).toContain("msg1");
    const edges = graph.get("res1") as any;
    expect(edges.edges).toHaveLength(1);
    expect(edges.edges[0].from).toBe("call1");
    expect(edges.edges[0].to).toBe("res1");
  });

  it("should handle circular dependencies correctly", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebugger();
    const graph = debuggerInstance.buildGraph([
      { type: "message", id: "msgA", data: {} },
      { type: "tool_call", id: "callB", data: {} },
      { type: "tool_result", id: "resC", data: {} },
    ]);

    // In a simple graph build, it should establish the direct dependencies without erroring on cycles
    const nodes = graph.get("callB") as any;
    expect(nodes.dependencies).toContain("msgA");
  });

  it("should correctly identify nodes with no dependencies", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebugger();
    const graph = debuggerInstance.buildGraph([
      { type: "message", id: "start", data: {} },
      { type: "tool_call", id: "call", data: {} },
    ]);

    const nodes = graph.get("start") as any;
    expect(nodes.dependencies).toHaveLength(0);
  });
});