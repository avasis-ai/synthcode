import { describe, it, expect } from "vitest";
import { analyzeToolCallDependencies } from "../src/graph/tool-call-dependency-graph-analyzer-advanced-v145";
import { Message, ToolCallNode } from "../src/graph/types";

describe("analyzeToolCallDependencies", () => {
  it("should correctly identify dependencies in a simple linear sequence", () => {
    const nodes: Map<string, ToolCallNode> = new Map([
      ["node1", {
        id: "node1",
        message: { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msg1" },
        dependencies: null,
      }],
      ["node2", {
        id: "node2",
        message: { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_call_id: "callA", result: "resultA" } }], message_id: "msg2" },
        dependencies: { required_tool_result_id: "resultA", required_input_from_message_id: "msg1" },
      }],
      ["node3", {
        id: "node3",
        message: { type: "text", content: [{ type: "text", text: "Final answer" }], message_id: "msg3" },
        dependencies: { required_tool_result_id: "resultA", required_input_from_message_id: "msg2" },
      }],
    ]);
    const history: Message[] = [
      { type: "user", content: [{ type: "text", text: "Start" }], message_id: "msg0" },
      { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msg1" },
      { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_call_id: "callA", result: "resultA" } }], message_id: "msg2" },
      { type: "text", content: [{ type: "text", text: "Final answer" }], message_id: "msg3" },
    ];

    const report = analyzeToolCallDependencies(nodes, history);

    expect(report.cycles).toEqual([]);
    expect(report.unmetPreconditions).toHaveLength(0);
  });

  it("should detect a circular dependency", () => {
    const nodes: Map<string, ToolCallNode> = new Map([
      ["nodeA", {
        id: "nodeA",
        message: { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msgA" },
        dependencies: { required_tool_result_id: "resultB", required_input_from_message_id: "msgB" },
      }],
      ["nodeB", {
        id: "nodeB",
        message: { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_call_id: "callB", result: "resultB" } }], message_id: "msgB" },
        dependencies: { required_tool_result_id: "resultA", required_input_from_message_id: "msgA" },
      }],
      ["nodeC", {
        id: "nodeC",
        message: { type: "text", content: [{ type: "text", text: "Final" }], message_id: "msgC" },
        dependencies: { required_tool_result_id: "resultB", required_input_from_message_id: "msgB" },
      }],
    ]);
    const history: Message[] = [
      { type: "user", content: [{ type: "text", text: "Start" }], message_id: "msg0" },
      { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msgA" },
      { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_call_id: "callB", result: "resultB" } }], message_id: "msgB" },
      { type: "text", content: [{ type: "text", text: "Final" }], message_id: "msgC" },
    ];

    const report = analyzeToolCallDependencies(nodes, history);

    expect(report.cycles).toEqual(["nodeA", "nodeB", "nodeA"]);
    expect(report.unmetPreconditions).toHaveLength(1);
  });

  it("should correctly identify unmet preconditions when a required tool result is missing", () => {
    const nodes: Map<string, ToolCallNode> = new Map([
      ["node1", {
        id: "node1",
        message: { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msg1" },
        dependencies: null,
      }],
      ["node2", {
        id: "node2",
        message: { type: "text", content: [{ type: "text", text: "Needs result" }], message_id: "msg2" },
        dependencies: { required_tool_result_id: "missing_result", required_input_from_message_id: "msg1" },
      }],
    ]);
    const history: Message[] = [
      { type: "user", content: [{ type: "text", text: "Start" }], message_id: "msg0" },
      { type: "tool_call", content: [{ type: "tool_use", tool_use: { tool_name: "toolA" } }], message_id: "msg1" },
      // Missing tool result message for "missing_result"
      { type: "text", content: [{ type: "text", text: "Some other text" }], message_id: "msg2" },
    ];

    const report = analyzeToolCallDependencies(nodes, history);

    expect(report.cycles).toEqual([]);
    expect(report.unmetPreconditions).toEqual([
      {
        node_id: "node2",
        missing_dependency: "required_tool_result_id",
        required_value: "missing_result",
        message: "Required tool result ID 'missing_result' was not found in the history.",
      },
    ]);
  });
});