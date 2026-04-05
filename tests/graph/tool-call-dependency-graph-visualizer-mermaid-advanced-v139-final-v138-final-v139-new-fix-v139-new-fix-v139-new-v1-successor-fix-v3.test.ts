import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../../../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix-v3";
import { Message, ToolUseBlock, ToolResultMessage } from "../../../src/graph/types";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic graph for a single tool call and result", () => {
    const context: any = {
      messages: [
        { type: "user", content: [{ type: "text", text: "What is the weather?" }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "get_weather", tool_input: { location: "Tokyo" } } }] },
        { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_name: "get_weather", result: "Sunny in Tokyo" } }] },
      ],
      toolCalls: [
        { id: "call1", name: "get_weather", input: { location: "Tokyo" } },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaid = visualizer.generateMermaid(context);

    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("A[User: What is the weather?] --> B(Tool Call: get_weather)");
    expect(mermaid).toContain("B --> C[Tool Result: Sunny in Tokyo]");
  });

  it("should handle multiple sequential tool calls and results", () => {
    const context: any = {
      messages: [
        { type: "user", content: [{ type: "text", text: "First, get the weather in London, then find the population." }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "get_weather", tool_input: { location: "London" } } }] },
        { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_name: "get_weather", result: "Cloudy in London" } }] },
        { type: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "get_population", tool_input: { city: "London" } } }] },
        { type: "tool_result", content: [{ type: "tool_result", tool_result: { tool_name: "get_population", result: "8.9 million" } }] },
      ],
      toolCalls: [
        { id: "call1", name: "get_weather", input: { location: "London" } },
        { id: "call2", name: "get_population", input: { city: "London" } },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaid = visualizer.generateMermaid(context);

    expect(mermaid).toContain("get_weather");
    expect(mermaid).toContain("get_population");
    expect(mermaid).toContain("A[User: First, get the weather in London, then find the population.]");
    expect(mermaid).toContain("C[Tool Result: 8.9 million]");
  });

  it("should generate an empty graph if no tool calls are present", () => {
    const context: any = {
      messages: [
        { type: "user", content: [{ type: "text", text: "Hello, how are you?" }] },
        { type: "assistant", content: [{ type: "text", text: "I am an AI." }] },
      ],
      toolCalls: [],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaid = visualizer.generateMermaid(context);

    expect(mermaid).toContain("graph TD");
    expect(mermaid).not.toContain("Tool Call");
    expect(mermaid).toContain("A[User: Hello, how are you?] --> B[Assistant: I am an AI.]");
  });
});