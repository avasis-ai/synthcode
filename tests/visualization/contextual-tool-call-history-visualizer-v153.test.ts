import { describe, it, expect } from "vitest";
import { ContextualToolCallHistoryVisualizer, ToolCallHistoryItem } from "../src/visualization/contextual-tool-call-history-visualizer-v153";

describe("ContextualToolCallHistoryVisualizer", () => {
  it("should initialize correctly with an empty history", () => {
    const history: ToolCallHistoryItem[] = [];
    const visualizer = new ContextualToolCallHistoryVisualizer(history);
    expect(visualizer.getHistory()).toEqual([]);
  });

  it("should return the provided history array", () => {
    const mockHistory: ToolCallHistoryItem[] = [
      { timestamp: 1678886400000, message: {}, contextId: "context1" },
      { timestamp: 1678886500000, message: {}, contextId: "context2" },
    ];
    const visualizer = new ContextualToolCallHistoryVisualizer(mockHistory);
    expect(visualizer.getHistory()).toEqual(mockHistory);
  });

  it("should handle a single history item correctly", () => {
    const mockHistory: ToolCallHistoryItem[] = [
      { timestamp: 1678886400000, message: {}, contextId: "context1" },
    ];
    const visualizer = new ContextualToolCallHistoryVisualizer(mockHistory);
    expect(visualizer.getHistory()).toEqual(mockHistory);
  });
});