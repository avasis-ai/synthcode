import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV139 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV139", () => {
  it("should generate a basic graph for a single user message", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: [{ type: "text", text: "Hello world" }],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139([userMessage]);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("graph TD");
    expect(graph).toContain("U1[User Message]");
  });

  it("should generate a graph showing user -> assistant -> tool result flow", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: [{ type: "text", text: "What is the weather?" }],
    };
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content: [{ type: "tool_use", tool_use: { name: "get_weather", input: "London" } }],
    };
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      content: [{ type: "text", text: "Sunny in London" }],
    };
    const messages: Message[] = [userMessage, assistantMessage, toolResultMessage];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139(messages);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("U1[User Message]");
    expect(graph).toContain("A2[Assistant Message]");
    expect(graph).toContain("T3[Tool Result]");
    expect(graph).toContain("U1 --> A2");
    expect(graph).toContain("A2 --> T3");
  });

  it("should handle multiple turns with different roles", () => {
    const userMessage1: UserMessage = {
      role: "user",
      content: [{ type: "text", text: "First query" }],
    };
    const assistantMessage1: AssistantMessage = {
      role: "assistant",
      content: [{ type: "text", text: "Here is the first answer." }],
    };
    const userMessage2: UserMessage = {
      role: "user",
      content: [{ type: "text", text: "Second query" }],
    };
    const messages: Message[] = [userMessage1, assistantMessage1, userMessage2];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV139(messages);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("U1[User Message]");
    expect(graph).toContain("A2[Assistant Message]");
    expect(graph).toContain("U3[User Message]");
    expect(graph).toContain("U1 --> A2");
    expect(graph).toContain("A2 --> U3");
  });
});