import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, AdvancedGraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v110";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic graph structure when only messages are provided", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "Hello" },
      { type: "assistant", content: "Hi there!" },
    ];
    const mermaidCode = visualizer.generateGraph(messages, {});

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("User --> Assistant");
  });

  it("should correctly incorporate tool calls and results into the graph", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "What is the weather?" },
      { type: "assistant", content: "ToolCall", toolUse: { name: "get_weather", input: { location: "Tokyo" } } },
      { type: "tool_result", content: "ToolResult", toolResult: { name: "get_weather", result: { temperature: "25C" } } },
      { type: "assistant", content: "The weather is 25C.", toolUse: { name: "summarize", input: { data: "25C" } } },
    ];
    const mermaidCode = visualizer.generateGraph(messages, {});

    expect(mermaidCode).toContain("User --> ToolCall");
    expect(mermaidCode).toContain("ToolCall --> ToolResult");
    expect(mermaidCode).toContain("ToolResult --> Assistant");
  });

  it("should apply conditional edge rules when provided", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "Check stock" },
      { type: "assistant", content: "ToolCall", toolUse: { name: "check_stock", input: { symbol: "AAPL" } } },
      { type: "tool_result", content: "ToolResult", toolResult: { name: "check_stock", result: { stock: 150 } } },
    ];
    const options: AdvancedGraphOptions = {
      showDependencies: true,
      conditionalEdgeRules: [
        {
          from: "User",
          to: "ToolCall",
          condition: (fromContent: any, toContent: any) => fromContent.includes("stock") && toContent.name === "check_stock",
          label: "Stock Check Initiated",
        },
      ],
    };
    const mermaidCode = visualizer.generateGraph(messages, options);

    expect(mermaidCode).toContain("User -- Stock Check Initiated --> ToolCall");
  });
});