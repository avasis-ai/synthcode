import { describe, it, expect } from "vitest";
import { analyzeToolCallDependencies } from "../src/graph/tool-call-dependency-graph-analyzer-advanced-v156";
import { Message, ToolUseBlock, ToolResultMessage } from "../src/graph/types";

describe("analyzeToolCallDependencies", () => {
  it("should correctly identify direct dependencies between tool calls and results", () => {
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_a", function_name: "get_weather", input_args: { location: "New York" } } },
      ],
    };
    const assistantMessage: Message = {
      role: "assistant",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_b", function_name: "get_stock_price", input_args: { ticker: "GOOGL" } } },
      ],
    };
    const toolResultMessage: Message = {
      role: "tool",
      content: [
        { type: "tool_result", block: { tool_use_id: "tool_a", content: { temperature: 25, unit: "C" } } },
      ],
    };

    const messages: Message[] = [userMessage, assistantMessage, toolResultMessage];
    const report = analyzeToolCallDependencies(messages);

    expect(report.implicit_flows).toHaveLength(1);
    expect(report.implicit_flows[0].source_node_id).toBe("tool_a");
    expect(report.implicit_flows[0].target_node_id).toBe("tool_b");
    expect(report.implicit_flows[0].variable_name).toBe("tool_a_result");
  });

  it("should handle multiple independent tool calls", () => {
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_x", function_name: "get_weather", input_args: { location: "London" } } },
      ],
    };
    const assistantMessage: Message = {
      role: "assistant",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_y", function_name: "get_stock_price", input_args: { ticker: "AAPL" } } },
      ],
    };
    const toolResultMessage: Message = {
      role: "tool",
      content: [
        { type: "tool_result", block: { tool_use_id: "tool_x", content: { temperature: 15, unit: "C" } } },
      ],
    };

    const messages: Message[] = [userMessage, assistantMessage, toolResultMessage];
    const report = analyzeToolCallDependencies(messages);

    expect(report.implicit_flows).toHaveLength(0);
  });

  it("should detect dependencies when a tool result influences a subsequent tool call", () => {
    const userMessage: Message = {
      role: "user",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_a", function_name: "get_weather", input_args: { location: "Paris" } } },
      ],
    };
    const assistantMessage: Message = {
      role: "assistant",
      content: [
        { type: "tool_use", block: { tool_use_id: "tool_b", function_name: "get_stock_price", input_args: { ticker: "MSFT" } } },
      ],
    };
    const toolResultMessage: Message = {
      role: "tool",
      content: [
        { type: "tool_result", block: { tool_use_id: "tool_a", content: { temperature: 20, unit: "C" } } },
      ],
    };

    const messages: Message[] = [userMessage, toolResultMessage, assistantMessage];
    const report = analyzeToolCallDependencies(messages);

    expect(report.implicit_flows).toHaveLength(1);
    expect(report.implicit_flows[0].source_node_id).toBe("tool_a");
    expect(report.implicit_flows[0].target_node_id).toBe("tool_b");
    expect(report.implicit_flows[0].variable_name).toBe("tool_a_result");
  });
});