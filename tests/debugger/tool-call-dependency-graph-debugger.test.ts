import { describe, it, expect } from "vitest";
import { DebuggerContext } from "../src/debugger/tool-call-dependency-graph-debugger";

describe("DebuggerContext", () => {
  it("should initialize with empty history and context", () => {
    const context = new DebuggerContext();
    expect(context.history).toBeDefined();
    expect(context.history).toEqual([]);
    expect(context.nodes).toBeDefined();
    expect(context.nodes).toEqual({});
  });

  it("should add a user message node and edge correctly", () => {
    const context = new DebuggerContext();
    const userMessage = { id: "user1", type: "user", data: "Hello" };
    const edge = { fromId: "start", toId: "user1", type: "call", details: {} };

    context.addStep(userMessage, edge);

    expect(context.nodes["user1"]).toEqual(userMessage);
    expect(context.history.length).toBe(1);
    expect(context.history[0].node).toEqual(userMessage);
    expect(context.history[0].edge).toEqual(edge);
  });

  it("should correctly update dependency graph when adding tool call and response", () => {
    const context = new DebuggerContext();
    const userMessage = { id: "user1", type: "user", data: "What is the weather?" };
    const userEdge = { fromId: "start", toId: "user1", type: "call", details: {} };
    context.addStep(userMessage, userEdge);

    const toolCallNode = { id: "tool_call_1", type: "tool", data: { name: "get_weather", args: {} } };
    const toolCallEdge = { fromId: "user1", toId: "tool_call_1", type: "call", details: {} };
    context.addStep(toolCallNode, toolCallEdge);

    const toolResultMessage = { id: "tool_result_1", type: "tool", data: { content: "Sunny" } };
    const responseEdge = { fromId: "tool_call_1", toId: "tool_result_1", type: "response", details: {} };
    context.addStep(toolResultMessage, responseEdge);

    expect(context.nodes["user1"]).toBeDefined();
    expect(context.nodes["tool_call_1"]).toBeDefined();
    expect(context.nodes["tool_result_1"]).toBeDefined();
    expect(context.history.length).toBe(3);
    expect(context.history[2].edge.type).toBe("response");
  });
});