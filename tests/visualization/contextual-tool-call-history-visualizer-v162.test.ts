import { describe, it, expect } from "vitest";
import { ContextualToolCallHistoryVisualizer } from "../src/visualization/contextual-tool-call-history-visualizer-v162";
import { ToolCallHistoryItem } from "../src/visualization/types";

describe("ContextualToolCallHistoryVisualizer", () => {
  it("renders correctly with only user messages", () => {
    const history: ToolCallHistoryItem[] = [
      { message: { role: "user", content: "Hello world" } },
      { message: { role: "user", content: "How are you?" } },
    ];
    const { container } = render(<ContextualToolCallHistoryVisualizer history={history} />);
    expect(container).toHaveTextContent("Hello world");
    expect(container).toHaveTextContent("How are you?");
  });

  it("renders tool calls and results when present", () => {
    const history: ToolCallHistoryItem[] = [
      {
        message: { role: "user", content: "What is the weather?" },
        tool_calls: [
          { id: "call1", name: "get_weather", input: { location: "Tokyo" } },
        ],
        tool_results: [
          { tool_use_id: "call1", content: "Sunny in Tokyo", is_error: false },
        ],
      },
    ];
    const { container } = render(<ContextualToolCallHistoryVisualizer history={history} />);
    expect(container).toHaveTextContent("What is the weather?");
    expect(container).toHaveTextContent("get_weather");
    expect(container).toHaveTextContent("Sunny in Tokyo");
  });

  it("renders a mix of message types including thinking blocks", () => {
    const history: ToolCallHistoryItem[] = [
      {
        message: { role: "assistant", content: "Thinking..." },
        tool_calls: [
          { id: "call1", name: "search", input: { query: "AI" } },
        ],
        tool_results: [
          { tool_use_id: "call1", content: "Search results for AI", is_error: false },
        ],
      },
    ];
    const { container } = render(<ContextualToolCallHistoryVisualizer history={history} />);
    expect(container).toHaveTextContent("Thinking...");
    expect(container).toHaveTextContent("search");
    expect(container).toHaveTextContent("Search results for AI");
  });
});