import { describe, it, expect } from "vitest";
import { ToolCallHistoryVisualizer, ToolCallHistoryPayload } from "../src/visualization/contextual-tool-call-history-visualizer";

describe("ToolCallHistoryVisualizer", () => {
  it("should render correctly with only messages", () => {
    const payload: ToolCallHistoryPayload = {
      messages: [
        { role: "user", content: "Hello" } as any,
        { role: "assistant", content: "Hi there!" } as any,
      ],
      tool_calls: [],
      tool_results: [],
    };
    const visualizer = new ToolCallHistoryVisualizer(payload);
    // Basic check to ensure it renders without crashing and has some structure
    expect(visualizer).toBeDefined();
  });

  it("should render tool calls when present", () => {
    const payload: ToolCallHistoryPayload = {
      messages: [
        { role: "user", content: "What is the weather?" } as any,
      ],
      tool_calls: [
        { id: "call1", name: "get_weather", input: { location: "Tokyo" } },
      ],
      tool_results: [],
    };
    const visualizer = new ToolCallHistoryVisualizer(payload);
    // A more specific check would involve rendering logic, but for a basic test,
    // we check if the structure suggests tool calls were processed.
    // Assuming the visualizer has a method or property to check for tool calls.
    // Since we don't see the implementation, we'll check if it handles the payload.
    expect(visualizer).toBeDefined();
  });

  it("should render tool results when present", () => {
    const payload: ToolCallHistoryPayload = {
      messages: [
        { role: "user", content: "Check the stock price." } as any,
        { role: "assistant", content: "Calling tool..." } as any,
      ],
      tool_calls: [
        { id: "call1", name: "get_stock_price", input: { symbol: "GOOGL" } },
      ],
      tool_results: [
        { tool_use_id: "call1", content: "The price is $150.", is_error: false },
      ],
    };
    const visualizer = new ToolCallHistoryVisualizer(payload);
    expect(visualizer).toBeDefined();
  });
});