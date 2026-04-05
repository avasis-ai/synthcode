import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV145 } from "../../../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v145";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../../../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV145", () => {
  it("should generate a basic graph for a single user message", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: {
        type: "text",
        text: "What is the capital of France?",
      },
    };
    const graph: Message[] = [userMessage];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145(graph);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User Input: \"What is the capital of France?...\"]");
  });

  it("should generate a graph showing user input, assistant thinking, and tool call", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: {
        type: "text",
        text: "Check the weather in London.",
      },
    };
    const thinkingMessage: AssistantMessage = {
      role: "assistant",
      content: {
        type: "thinking",
        text: "Thinking about the best tool to use...",
      },
    };
    const toolUseMessage: AssistantMessage = {
      role: "assistant",
      content: {
        type: "tool_use",
        tool_use: {
          tool_name: "get_weather",
          parameters: { location: "London" },
        },
      },
    };
    const graph: Message[] = [userMessage, thinkingMessage, toolUseMessage];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145(graph);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("A[User Input: \"Check the weather in London?...\"]");
    expect(mermaidCode).toContain("B[Thinking about the best tool to use...]");
    expect(mermaidCode).toContain("C[Tool Call: get_weather(location=\"London\")]");
  });

  it("should generate a graph including a tool result message", () => {
    const userMessage: UserMessage = {
      role: "user",
      content: {
        type: "text",
        text: "What is the population of Tokyo?",
      },
    };
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      content: {
        type: "tool_result",
        tool_result: {
          tool_name: "get_population",
          result: "Population of Tokyo is 13.9 million.",
        },
      },
    };
    const graph: Message[] = [userMessage, toolResultMessage];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145(graph);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("A[User Input: \"What is the population of Tokyo?...\"]");
    expect(mermaidCode).toContain("B[Tool Result: Population of Tokyo is 13.9 million.]");
  });
});