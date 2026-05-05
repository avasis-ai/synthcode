import { describe, it, expect } from "vitest";
import {
  ContextualHistoryPayload,
  ToolCallHistoryItem,
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/visualization/contextual-tool-call-history-visualizer-v159";

describe("ContextualHistoryPayload", () => {
  it("should correctly structure a basic history payload", () => {
    const mockHistoryItem: ToolCallHistoryItem = {
      message: new UserMessage("Hello world"),
      tool_call_id: "call-123",
      dependencies: [],
      resource_usage: [],
    };
    const payload: ContextualHistoryPayload = { history: [mockHistoryItem] };

    expect(payload).toHaveProperty("history");
    expect(payload.history).toBeInstanceOf(Array);
    expect(payload.history!.length).toBe(1);
  });

  it("should handle multiple history items with dependencies", () => {
    const mockHistoryItem1: ToolCallHistoryItem = {
      message: new AssistantMessage("Tool call made"),
      tool_call_id: "call-456",
      dependencies: [
        {
          source_id: "msg-abc",
          target_id: "call-456",
          type: "dependency",
        },
      ],
      resource_usage: [{metric: "cpu", value: 0.5}],
    };
    const mockHistoryItem2: ToolCallHistoryItem = {
      message: new ToolResultMessage("Tool result received"),
      tool_call_id: "call-456",
      dependencies: [],
      resource_usage: [],
    };
    const payload: ContextualHistoryPayload = { history: [mockHistoryItem1, mockHistoryItem2] };

    expect(payload.history!.length).toBe(2);
    expect(payload.history![0].dependencies).toHaveLength(1);
    expect(payload.history![1].message).toBeInstanceOf(ToolResultMessage);
  });

  it("should return an empty history array for an empty payload", () => {
    const payload: ContextualHistoryPayload = { history: [] };
    expect(payload.history).toEqual([]);
  });
});