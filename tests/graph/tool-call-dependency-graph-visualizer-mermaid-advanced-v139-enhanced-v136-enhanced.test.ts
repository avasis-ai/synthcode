import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, GraphContext } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-enhanced-v136-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic graph for a simple tool call sequence", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "What is the weather in London?" },
        { type: "assistant", content: "Calling weather_api..." },
      ],
      toolCalls: [
        { id: "call1", name: "weather_api", input: { location: "London" } },
      ],
      flowControlPoints: [],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("User -> ToolCall_weather_api");
    expect(mermaidCode).toContain("ToolCall_weather_api --> Assistant");
  });

  it("should handle multiple tool calls and sequential flow", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "First, get the weather, then search for restaurants." },
        { type: "assistant", content: "Calling weather_api..." },
        { type: "assistant", content: "Calling search_api..." },
      ],
      toolCalls: [
        { id: "call1", name: "weather_api", input: { location: "London" } },
        { id: "call2", name: "search_api", input: { query: "restaurants" } },
      ],
      flowControlPoints: [],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);

    expect(mermaidCode).toContain("ToolCall_weather_api");
    expect(mermaidCode).toContain("ToolCall_search_api");
    expect(mermaidCode).toContain("ToolCall_weather_api --> ToolCall_search_api");
  });

  it("should include flow control points in the graph structure", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Check the status, and if it's down, notify the team." },
        { type: "assistant", content: "Checking status..." },
      ],
      toolCalls: [],
      flowControlPoints: [
        { type: "conditional", description: "Status check", sourceNodeId: "Start", targetNodeId: "CheckStatus" },
        { type: "loop", description: "Retry loop", sourceNodeId: "CheckStatus", targetNodeId: "Retry" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);

    expect(mermaidCode).toContain("Start -- Status check --> CheckStatus");
    expect(mermaidCode).toContain("CheckStatus -- Retry loop --> Retry");
  });
});