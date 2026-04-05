import { describe, it, expect } from "vitest";
import { MermaidAdvancedGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v154";
import { Message, ToolUseBlock } from "../src/graph/types";

describe("MermaidAdvancedGraphVisualizer", () => {
  const visualizer = new MermaidAdvancedGraphVisualizer();

  it("should generate a basic mermaid graph for a single user message", () => {
    const messages: Message[] = [
      { role: "user", content: "What is the capital of France?" },
    ];
    const config = {};
    const mermaidGraph = visualizer.generateMermaidGraph(messages, config);

    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("A[User: What is the capital of France?]");
    expect(mermaidGraph).not.toContain("tool_call");
  });

  it("should generate a graph including a tool use block", () => {
    const messages: Message[] = [
      { role: "user", content: "Get the weather in London." },
      {
        role: "assistant",
        content: null,
        toolCalls: [
          {
            name: "get_weather",
            args: { location: "London" },
          },
        ],
      },
    ];
    const config = { layoutAlgorithm: "hierarchical" };
    const mermaidGraph = visualizer.generateMermaidGraph(messages, config);

    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("A[User: Get the weather in London.]");
    expect(mermaidGraph).toContain("B{Tool Call: get_weather}");
    expect(mermaidGraph).toContain("B -->|args| C[location: London]");
  });

  it("should handle multiple messages with different roles and structure", () => {
    const messages: Message[] = [
      { role: "user", content: "Hello." },
      {
        role: "assistant",
        content: "Hello there!",
      },
      {
        role: "user",
        content: "What is the time?",
        toolCalls: [
          {
            name: "get_time",
            args: { timezone: "UTC" },
          },
        ],
      },
    ];
    const config = { colorPalette: "pastel" };
    const mermaidGraph = visualizer.generateMermaidGraph(messages, config);

    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("A[User: Hello.]");
    expect(mermaidGraph).toContain("B[Assistant: Hello there!]");
    expect(mermaidGraph).toContain("C[User: What is the time?]");
    expect(mermaidGraph).toContain("D{Tool Call: get_time}");
  });
});