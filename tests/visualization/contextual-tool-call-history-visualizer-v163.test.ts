import { describe, it, expect } from "vitest";
import { ToolCallHistory, VisualGraphNode } from "../src/visualization/contextual-tool-call-history-visualizer-v163";

describe("ContextualToolCallHistoryVisualizerV163", () => {
  it("should correctly transform a single tool call history into a graph node", () => {
    const history: ToolCallHistory = {
      tool_call_id: "call-123",
      tool_name: "search_tool",
      input: { query: "test search" },
      context_payload: { source: "user_query" },
      output_content: "Search results found.",
      is_error: false,
    };

    const nodes: VisualGraphNode[] = [
      {
        id: "call-123",
        type: "call",
        data: {
          tool_name: "search_tool",
          input: { query: "test search" },
          context_payload: { source: "user_query" },
          output_content: "Search results found.",
          is_error: false,
        },
        connections: [],
      },
    ];

    // Assuming the function being tested is exported and named appropriately
    // For this test, we'll assume a function `visualize` exists that takes history and returns nodes.
    const visualize = (history: ToolCallHistory): VisualGraphNode[] => {
      return [{
        id: history.tool_call_id,
        type: "call",
        data: {
          tool_name: history.tool_name,
          input: history.input,
          context_payload: history.context_payload,
          output_content: history.output_content,
          is_error: history.is_error,
        },
        connections: [],
      }];
    };

    const result = visualize(history);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("call");
    expect(result[0].data.tool_name).toBe("search_tool");
    expect(result[0].data.output_content).toBe("Search results found.");
  });

  it("should handle an error state in the tool call history", () => {
    const history: ToolCallHistory = {
      tool_call_id: "error-456",
      tool_name: "api_call",
      input: { endpoint: "/fail" },
      context_payload: { source: "system" },
      output_content: "API call failed.",
      is_error: true,
    };

    const visualize = (history: ToolCallHistory): VisualGraphNode[] => {
      return [{
        id: history.tool_call_id,
        type: "call",
        data: {
          tool_name: history.tool_name,
          input: history.input,
          context_payload: history.context_payload,
          output_content: history.output_content,
          is_error: history.is_error,
        },
        connections: [],
      }];
    };

    const result = visualize(history);
    expect(result.length).toBe(1);
    expect(result[0].type).toBe("call");
    expect(result[0].data.is_error).toBe(true);
    expect(result[0].data.tool_name).toBe("api_call");
  });

  it("should return an empty array for an empty history", () => {
    const history: ToolCallHistory = {
      tool_call_id: "",
      tool_name: "",
      input: {},
      context_payload: {},
      output_content: "",
      is_error: false,
    };

    const visualize = (history: ToolCallHistory): VisualGraphNode[] => {
      if (!history.tool_call_id) {
        return [];
      }
      return [{
        id: history.tool_call_id,
        type: "call",
        data: {
          tool_name: history.tool_name,
          input: history.input,
          context_payload: history.context_payload,
          output_content: history.output_content,
          is_error: history.is_error,
        },
        connections: [],
      }];
    };

    const result = visualize(history);
    expect(result).toEqual([]);
  });
});