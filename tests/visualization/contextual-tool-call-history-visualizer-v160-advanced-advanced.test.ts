import { describe, it, expect } from "vitest";
import { ToolCallHistoryVisualizer } from "../src/visualization/contextual-tool-call-history-visualizer-v160-advanced-advanced";
import { Message, ToolUseBlock, ThinkingBlock, ToolResultMessage } from "../src/visualization/types";

describe("ToolCallHistoryVisualizer", () => {
  it("should render basic message history correctly", () => {
    const messages: Message[] = [
      { role: "user", content: "Hello", blocks: [{ type: "text", content: "Hello" }] },
      { role: "assistant", content: "Hi there!", blocks: [{ type: "text", content: "Hi there!" }] },
    ];
    const visualizer = new ToolCallHistoryVisualizer(messages);
    const renderedHtml = visualizer.render();

    expect(renderedHtml).toContain("Hello");
    expect(renderedHtml).toContain("Hi there!");
  });

  it("should render tool use and result blocks", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: "What is the weather?",
        blocks: [{ type: "tool_use", content: { toolName: "get_weather", toolInput: { location: "Tokyo" } } }],
      },
      {
        role: "assistant",
        content: null,
        blocks: [
          { type: "thinking", content: "Thinking about the weather..." },
          { type: "tool_result", content: { toolName: "get_weather", result: { temperature: "25C", condition: "Sunny" } } },
        ],
      },
    ];
    const visualizer = new ToolCallHistoryVisualizer(messages);
    const renderedHtml = visualizer.render();

    expect(renderedHtml).toContain("get_weather");
    expect(renderedHtml).toContain("Tokyo");
    expect(renderedHtml).toContain("25C");
    expect(renderedHtml).toContain("Sunny");
  });

  it("should handle a mix of message types including thinking blocks", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: "Analyze this data.",
        blocks: [{ type: "text", content: "Data to analyze." }],
      },
      {
        role: "assistant",
        content: null,
        blocks: [
          { type: "thinking", content: "Analyzing the data structure..." },
          { type: "text", content: "The analysis is complete." },
        ],
      },
    ];
    const visualizer = new ToolCallHistoryVisualizer(messages);
    const renderedHtml = visualizer.render();

    expect(renderedHtml).toContain("Data to analyze.");
    expect(renderedHtml).toContain("Analyzing the data structure...");
    expect(renderedHtml).toContain("The analysis is complete.");
  });
});