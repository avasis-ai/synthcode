import { describe, it, expect } from "vitest";
import {
  AdvancedLayoutOptions,
  GraphContext,
  ToolCallDependencyGraphVisualizerMermaidAdvancedV152,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v152";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV152", () => {
  it("should generate a basic graph structure for simple message flow", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Hello", role: "user" },
        { type: "assistant", content: "Hi there!", role: "assistant" },
      ],
      layoutOptions: {
        layoutType: "force-directed",
        direction: "TD",
        nodeGrouping: {},
        linkWeighting: () => 1,
      },
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV152();
    const mermaidCode = visualizer.generateMermaid(context);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("User");
    expect(mermaidCode).toContain("Assistant");
  });

  it("should handle tool calls and results correctly in the graph", () => {
    const context: GraphContext = {
      messages: [
        {
          type: "user",
          content: "What is the weather?",
          role: "user",
        },
        {
          type: "assistant",
          content: "Tool call",
          role: "assistant",
          toolUse: {
            name: "get_weather",
            args: { location: "Tokyo" },
          },
        },
        {
          type: "tool_result",
          content: "Sunny",
          role: "tool_result",
          toolResult: {
            name: "get_weather",
            result: "Sunny",
          },
        },
      ],
      layoutOptions: {
        layoutType: "layered",
        direction: "TB",
        nodeGrouping: { "user": "UserGroup" },
        linkWeighting: () => 1,
      },
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV152();
    const mermaidCode = visualizer.generateMermaid(context);

    expect(mermaidCode).toContain("get_weather");
    expect(mermaidCode).toContain("User");
    expect(mermaidCode).toContain("ToolResult");
  });

  it("should adjust graph structure based on layout direction (e.g., LR)", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Start", role: "user" },
        { type: "assistant", content: "Middle", role: "assistant" },
      ],
      layoutOptions: {
        layoutType: "force-directed",
        direction: "LR",
        nodeGrouping: {},
        linkWeighting: () => 1,
      },
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV152();
    const mermaidCode = visualizer.generateMermaid(context);

    expect(mermaidCode).toContain("graph LR");
    expect(mermaidCode).toContain("Start");
    expect(mermaidCode).toContain("Middle");
  });
});