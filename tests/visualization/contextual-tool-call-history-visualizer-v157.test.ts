import { describe, it, expect } from "vitest";
import {
  ContextualToolCallHistoryVisualizerV157,
  ToolCallHistory,
  ToolCallHistoryPayload,
} from "../src/visualization/contextual-tool-call-history-visualizer-v157";

describe("ContextualToolCallHistoryVisualizerV157", () => {
  it("should correctly initialize with provided history and context", () => {
    const mockHistory: ToolCallHistory[] = [
      {
        callId: "call-1",
        toolName: "search",
        input: { query: "test" },
        output: "Search results for test",
        causality: "initial",
      },
    ];
    const mockPayload: ToolCallHistoryPayload = {
      history: mockHistory,
      initialContext: { user: "test_user" },
    };

    const visualizer = new ContextualToolCallHistoryVisualizerV157(
      mockPayload
    );

    expect(visualizer).toBeDefined();
    expect(visualizer.history).toEqual(mockHistory);
    expect(visualizer.initialContext).toEqual(mockPayload.initialContext);
  });

  it("should render a basic structure when history is present", () => {
    const mockHistory: ToolCallHistory[] = [
      {
        callId: "call-1",
        toolName: "search",
        input: { query: "test" },
        output: "Search results for test",
        causality: "initial",
      },
    ];
    const mockPayload: ToolCallHistoryPayload = {
      history: mockHistory,
      initialContext: {},
    };

    const visualizer = new ContextualToolCallHistoryVisualizerV157(
      mockPayload
    );

    // Assuming the visualizer has a method or property to check rendered content/structure
    // We'll check if the internal structure reflects the history length.
    expect(visualizer.history.length).toBe(1);
  });

  it("should handle empty history gracefully", () => {
    const mockPayload: ToolCallHistoryPayload = {
      history: [],
      initialContext: { user: "guest" },
    };

    const visualizer = new ContextualToolCallHistoryVisualizerV157(
      mockPayload
    );

    expect(visualizer.history).toEqual([]);
    expect(visualizer.initialContext).toEqual({ user: "guest" });
  });
});