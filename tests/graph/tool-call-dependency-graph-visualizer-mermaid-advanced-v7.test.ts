import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV7 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v7";
import { Message, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV7", () => {
  it("should generate a basic graph for a simple tool call sequence", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "What is the weather like?" },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            tool_use: {
              name: "get_weather",
              input: { location: "San Francisco" },
            },
          },
        ],
      },
      {
        role: "tool_result",
        content: [
          {
            type: "tool_result",
            tool_result: {
              tool_call_id: "call_123",
              content: "Sunny with a high of 70F",
            },
          },
        ],
      },
    ];
    const config = { messages, graphType: "mermaid-advanced-v7" };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV7(config);
    const graph = visualizer.generateGraph();

    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[User Message]");
    expect(graph).toContain("B[Tool Call: get_weather]");
    expect(graph).toContain("C[Tool Result: Sunny with a high of 70F]");
    expect(graph).toContain("A --> B");
    expect(graph).toContain("B --> C");
  });

  it("should handle a sequence involving thinking and multiple tool calls", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "Plan a trip to Paris and check the flight." },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "thinking", content: "Thinking about the plan..." },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            tool_use: {
              name: "plan_trip",
              input: { destination: "Paris" },
            },
          },
        ],
      },
      {
        role: "tool_result",
        content: [
          {
            type: "tool_result",
            tool_result: {
              tool_call_id: "call_abc",
              content: "Trip planned successfully.",
            },
          },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            tool_use: {
              name: "check_flight",
              input: { destination: "Paris" },
            },
          },
        ],
      },
    ];
    const config = { messages, graphType: "mermaid-advanced-v7" };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV7(config);
    const graph = visualizer.generateGraph();

    expect(graph).toContain("graph TD");
    expect(graph).toContain("User Message");
    expect(graph).toContain("Thinking Block");
    expect(graph).toContain("Tool Call: plan_trip");
    expect(graph).toContain("Tool Call: check_flight");
    expect(graph).toContain("Tool Result");
  });

  it("should generate an empty graph if no messages are provided", () => {
    const messages: Message[] = [];
    const config = { messages, graphType: "mermaid-advanced-v7" };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV7(config);
    const graph = visualizer.generateGraph();

    expect(graph).toBe("");
  });
});