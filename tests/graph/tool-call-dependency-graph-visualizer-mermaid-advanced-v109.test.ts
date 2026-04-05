import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV109 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v109";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV109", () => {
  it("should correctly visualize a simple linear call-response flow", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: [
        { type: "text", content: "What is the weather?" },
      ],
    };
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content: [
        { type: "tool_use", tool_use: { tool_name: "get_weather", tool_input: { location: "Tokyo" } } },
      ],
    };
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      content: [
        { type: "text", content: "The weather in Tokyo is sunny." },
      ],
    };

    const graph = new ToolCallDependencyGraphVisualizerMermaidAdvancedV109([
      userMessage,
      assistantMessage,
      toolResultMessage,
    ]);

    const mermaidDiagram = graph.generateMermaidDiagram();
    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[User Message]");
    expect(mermaidDiagram).toContain("B[Assistant Message]");
    expect(mermaidDiagram).toContain("C[Tool Result]");
    expect(mermaidDiagram).toContain("A -->|call| B");
    expect(mermaidDiagram).toContain("B -->|response| C");
  });

  it("should handle multiple tool calls and dependencies", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: [
        { type: "text", content: "Check weather and get stock price." },
      ],
    };
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          tool_use: { tool_name: "get_weather", tool_input: { location: "Tokyo" } },
        },
        {
          type: "tool_use",
          tool_use: { tool_name: "get_stock_price", tool_input: { symbol: "GOOGL" } },
        },
      ],
    };
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      content: [
        { type: "text", content: "Weather: Sunny." },
      ],
    };

    const graph = new ToolCallDependencyGraphVisualizerMermaidAdvancedV109([
      userMessage,
      assistantMessage,
      toolResultMessage,
    ]);

    const mermaidDiagram = graph.generateMermaidDiagram();
    expect(mermaidDiagram).toContain("A[User Message]");
    expect(mermaidDiagram).toContain("B[Assistant Message]");
    expect(mermaidDiagram).toContain("C[Tool Result]");
    expect(mermaidDiagram).toContain("A -->|call| B");
    expect(mermaidDiagram).toContain("B -->|response| C");
  });

  it("should generate an empty diagram for an empty message list", () => {
    const graph = new ToolCallDependencyGraphVisualizerMermaidAdvancedV109([]);
    const mermaidDiagram = graph.generateMermaidDiagram();
    expect(mermaidDiagram).toBe("");
  });
});