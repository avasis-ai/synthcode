import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV145Final } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v145-final";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV145Final", () => {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145Final();

  it("should generate a basic graph structure for a simple user-assistant interaction", () => {
    const graphData = {
      nodes: [
        {
          id: "user1",
          message: { role: "user", content: "Hello world" },
          type: "user",
          contentBlocks: [{ type: "text", content: "Hello world" }],
        },
        {
          id: "assistant1",
          message: { role: "assistant", content: "Hi there!" },
          type: "assistant",
          contentBlocks: [{ type: "text", content: "Hi there!" }],
        },
      ],
      dependencies: [
        { from: "user1", to: "assistant1" },
      ],
    };

    const mermaid = visualizer.generateMermaidGraph(graphData);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("user1 --> assistant1");
  });

  it("should include tool call nodes and dependencies when tools are used", () => {
    const graphData = {
      nodes: [
        {
          id: "user1",
          message: { role: "user", content: "What is the weather?" },
          type: "user",
          contentBlocks: [{ type: "text", content: "What is the weather?" }],
        },
        {
          id: "assistant1",
          message: { role: "assistant", content: "Calling tool" },
          type: "assistant",
          contentBlocks: [{ type: "tool_use", content: "weather_api" }],
        },
        {
          id: "tool_call1",
          message: { role: "tool", content: "Tool output" },
          type: "tool",
          contentBlocks: [{ type: "tool_output", content: "{\"temp\": 25}" }],
        },
      ],
      dependencies: [
        { from: "user1", to: "assistant1" },
        { from: "assistant1", to: "tool_call1" },
      ],
    };

    const mermaid = visualizer.generateMermaidGraph(graphData);
    expect(mermaid).toContain("tool_call1");
    expect(mermaid).toContain("assistant1 --> tool_call1");
  });

  it("should handle complex dependencies with conditions", () => {
    const graphData = {
      nodes: [
        {
          id: "user1",
          message: { role: "user", content: "First step" },
          type: "user",
          contentBlocks: [{ type: "text", content: "First step" }],
        },
        {
          id: "assistant1",
          message: { role: "assistant", content: "Next step" },
          type: "assistant",
          contentBlocks: [{ type: "text", content: "Next step" }],
        },
      ],
      dependencies: [
        { from: "user1", to: "assistant1", condition: "success" },
      ],
    };

    const mermaid = visualizer.generateMermaidGraph(graphData);
    expect(mermaid).toContain("user1 -->|success| assistant1");
  });
});