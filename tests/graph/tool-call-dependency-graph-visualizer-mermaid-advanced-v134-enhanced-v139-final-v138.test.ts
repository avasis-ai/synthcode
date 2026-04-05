import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v138";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138", () => {
  it("should generate a basic graph structure for a simple tool call sequence", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", content: "What is the weather like in London?" },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            tool_use: {
              tool_name: "get_weather",
              tool_input: { location: "London" },
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
              tool_name: "get_weather",
              tool_result: { temperature: "15C", condition: "Cloudy" },
            },
          },
        ],
      },
    ];

    const options = {};
    const mermaidCode = ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138.visualize(messages, options);

    expect(mermaidCode).toBeDefined();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User Message]");
    expect(mermaidCode).toContain("B[Tool Call: get_weather]");
    expect(mermaidCode).toContain("C[Tool Result]");
  });

  it("should handle multiple tool calls and complex message flow", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", content: "First, get the weather, then find restaurants." },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            tool_use: {
              tool_name: "get_weather",
              tool_input: { location: "London" },
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
              tool_name: "get_weather",
              tool_result: { temperature: "15C", condition: "Cloudy" },
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
              tool_name: "find_restaurants",
              tool_input: { cuisine: "Italian" },
            },
          },
        ],
      },
    ];

    const options = { title: "Complex Flow" };
    const mermaidCode = ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138.visualize(messages, options);

    expect(mermaidCode).toBeDefined();
    expect(mermaidCode).toContain("title: Complex Flow");
    expect(mermaidCode).toContain("get_weather");
    expect(mermaidCode).toContain("find_restaurants");
  });

  it("should apply custom node and edge styles when provided in options", () => {
    const messages = [
      {
        role: "user",
        content: [{ type: "text", content: "Test" }],
      },
      {
        role: "assistant",
        content: [{
          type: "tool_use",
          tool_use: { tool_name: "test_tool", tool_input: {} },
        }],
      },
    ];

    const options = {
      nodeStyleMap: {
        "User Message": { shape: "rhombus", style: "fill:#f9f,stroke:#333" },
        "Tool Call": { shape: "hexagon" },
      },
      edgeStyleMap: {
        "User Message --> Tool Call": { style: "stroke-width:2px,stroke:blue" },
      },
    };
    const mermaidCode = ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV138.visualize(messages, options);

    expect(mermaidCode).toBeDefined();
    // Checking for the presence of style directives based on the options
    expect(mermaidCode).toContain("style");
    expect(mermaidCode).toContain("rhombus");
  });
});