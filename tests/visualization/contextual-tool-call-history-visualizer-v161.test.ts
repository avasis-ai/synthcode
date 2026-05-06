import { describe, it, expect } from "vitest";
import { ContextualToolCallHistoryVisualizerProps } from "../src/visualization/contextual-tool-call-history-visualizer-v161";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContextualToolCallHistoryVisualizer } from "../src/visualization/contextual-tool-call-history-visualizer-v161";

const mockHistory: ToolCallRecord[] = [
  {
    tool_use_id: "tool_1",
    tool_name: "get_weather",
    tool_input: { location: "New York" },
    timestamp: 1678886400000,
    resource_usage: { cpu_ms: 10, memory_kb: 50 },
    result_content: "The weather in New York is 20C.",
  },
  {
    tool_use_id: "tool_2",
    tool_name: "get_stock_price",
    tool_input: { symbol: "GOOGL" },
    timestamp: 1678886500000,
    resource_usage: { cpu_ms: 20, memory_kb: 70 },
    result_content: "GOOGL price is $150.00.",
    is_error: true,
  },
];

describe("ContextualToolCallHistoryVisualizer", () => {
  it("renders correctly with a history of tool calls", () => {
    render(
      <ContextualToolCallHistoryVisualizer props={{ history: mockHistory }} />
    );
    expect(screen.getByText(/The weather in New York is 20C\./i)).toBeInTheDocument();
    expect(screen.getByText(/GOOGL price is \$150.00\./i)).toBeInTheDocument();
  });

  it("renders nothing when the history is empty", () => {
    render(
      <ContextualToolCallHistoryVisualizer props={{ history: [] }} />
    );
    expect(screen.queryByText(/No tool call history available/i)).toBeInTheDocument();
  });

  it("displays resource usage information for each tool call", () => {
    render(
      <ContextualToolCallHistoryVisualizer props={{ history: mockHistory }} />
    );
    // Assuming the component displays resource usage details somewhere
    expect(screen.getByText(/CPU Usage: 10ms/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory Usage: 50KB/i)).toBeInTheDocument();
  });
});