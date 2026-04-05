import { describe, it, expect } from "vitest";
import {
  GraphContext,
  NodeConfig,
  EdgeConfig,
  GraphVisualizer,
} from "../graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v138-final-v139-new-fix-v2";

describe("GraphVisualizer", () => {
  it("should generate a basic graph structure for a simple user-assistant exchange", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Hello world" } as UserMessage,
        { type: "assistant", content: "Hi there!" } as AssistantMessage,
      ],
      toolCalls: [],
      toolResults: [],
    };
    const visualizer = new GraphVisualizer(context);
    const graph = visualizer.generateGraph();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].id).toBe("user_0");
    expect(graph.nodes[1].id).toBe("assistant_1");
  });

  it("should include tool use and result nodes when tools are called", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "What is the weather in London?" } as UserMessage,
        { type: "assistant", content: "Calling weather tool..." } as AssistantMessage,
      ],
      toolCalls: [
        { id: "call_1", name: "get_weather", input: { location: "London" } },
      ],
      toolResults: [
        { tool_use_id: "call_1", content: "Sunny with 20C" },
      ],
    };
    const visualizer = new GraphVisualizer(context);
    const graph = visualizer.generateGraph();

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.nodes.some(n => n.id.includes("tool_call"))).toBe(true);
    expect(graph.nodes.some(n => n.id.includes("tool_result"))).toBe(true);
  });

  it("should handle multiple tool calls and results correctly", () => {
    const context: GraphContext = {
      messages: [
        { type: "user", content: "Get weather and stock price." } as UserMessage,
        { type: "assistant", content: "Calling tools..." } as AssistantMessage,
      ],
      toolCalls: [
        { id: "call_1", name: "get_weather", input: { location: "London" } },
        { id: "call_2", name: "get_stock", input: { ticker: "GOOG" } },
      ],
      toolResults: [
        { tool_use_id: "call_1", content: "Sunny with 20C" },
        { tool_use_id: "call_2", content: "Price: 150.00" },
      ],
    };
    const visualizer = new GraphVisualizer(context);
    const graph = visualizer.generateGraph();

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes.filter(n => n.type === "tool_call")).toHaveLength(2);
    expect(graph.nodes.filter(n => n.type === "tool_result")).toHaveLength(2);
  });
});