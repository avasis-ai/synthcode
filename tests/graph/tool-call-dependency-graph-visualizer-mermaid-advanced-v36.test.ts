import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV36 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v36";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV36", () => {
  it("should generate a basic graph structure for a simple tool call sequence", () => {
    const messages = [
      { role: "user", content: { type: "text", text: "What is the weather?" } },
      { role: "assistant", content: { type: "tool_use", tool_use: { name: "get_weather", input: { location: "Tokyo" } } } },
      { role: "tool", content: { type: "tool_response", tool_response: { name: "get_weather", content: "Sunny" } } },
    ];
    const dependencies = [
      { from: "user", to: "assistant", type: "call" },
      { from: "assistant", to: "tool", type: "response" },
    ];
    const graph = { messages, dependencies };
    const config = { graphType: "graph TD", advancedDirectives: [] };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV36(graph, config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user --> assistant");
    expect(mermaidCode).toContain("assistant --> tool");
  });

  it("should handle multiple tool calls and responses correctly", () => {
    const messages = [
      { role: "user", content: { type: "text", text: "Get weather in Tokyo and get stock price for AAPL." } },
      { role: "assistant", content: { type: "tool_use", tool_use: { name: "get_weather", input: { location: "Tokyo" } } } },
      { role: "tool", content: { type: "tool_response", tool_response: { name: "get_weather", content: "Sunny" } } },
      { role: "assistant", content: { type: "tool_use", tool_use: { name: "get_stock_price", input: { ticker: "AAPL" } } } },
      { role: "tool", content: { type: "tool_response", tool_response: { name: "get_stock_price", content: "150.00" } } },
    ];
    const dependencies = [
      { from: "user", to: "assistant", type: "call" },
      { from: "assistant", to: "tool", type: "response" },
      { from: "assistant", to: "tool", type: "response" },
    ];
    const graph = { messages, dependencies };
    const config = { graphType: "graph TD", advancedDirectives: [] };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV36(graph, config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("user --> assistant");
    expect(mermaidCode).toContain("assistant --> tool");
    expect(mermaidCode).toMatch(/get_weather.*Sunny/s);
    expect(mermaidCode).toMatch(/get_stock_price.*150\.00/s);
  });

  it("should incorporate advanced directives when provided", () => {
    const messages = [
      { role: "user", content: { type: "text", text: "Start." } },
      { role: "assistant", content: { type: "tool_use", tool_use: { name: "tool1", input: {} } } },
    ];
    const dependencies = [
      { from: "user", to: "assistant", type: "call" },
    ];
    const graph = { messages, dependencies };
    const config = { graphType: "graph TD", advancedDirectives: ["%%{init: {theme: neutral}}"] };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV36(graph, config);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("%%{init: {theme: neutral}}");
    expect(mermaidCode).toContain("user --> assistant");
  });
});