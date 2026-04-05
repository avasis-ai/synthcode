import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphBuilder } from "../src/graph/tool-call-dependency-graph-builder-v2";

describe("ToolCallDependencyGraphBuilder", () => {
  it("should build a basic dependency graph from a sequence of messages", () => {
    const builder = new ToolCallDependencyGraphBuilder();
    const userMessage = { role: "user", content: "What is the weather in London?" };
    const assistantMessage = { role: "assistant", content: "I need to call the weather tool." };
    const toolResultMessage = { role: "tool", content: "{\"tool_call_id\": \"weather_api\", \"parameters\": {\"location\": \"London\"}}" };

    builder.addMessage(userMessage);
    builder.addMessage(assistantMessage);
    builder.addMessage(toolResultMessage);

    const graph = builder.buildGraph();

    expect(graph.nodes.size).toBe(3);
    expect(graph.dependencies.has("weather_api")).toBe(true);
    expect(graph.preconditions.get("weather_api")).toBeDefined();
  });

  it("should handle multiple tool calls and dependencies correctly", () => {
    const builder = new ToolCallDependencyGraphBuilder();
    const userMessage = { role: "user", content: "First, check the stock price, then summarize the news." };
    const assistantMessage = { role: "assistant", content: "I need to call stock_price and then news_summarizer." };
    const toolResultMessage1 = { role: "tool", content: "{\"tool_call_id\": \"stock_price\", \"parameters\": {\"ticker\": \"GOOG\"}}" };
    const toolResultMessage2 = { role: "tool", content: "{\"tool_call_id\": \"news_summarizer\", \"parameters\": {}}" };

    builder.addMessage(userMessage);
    builder.addMessage(assistantMessage);
    builder.addMessage(toolResultMessage1);
    builder.addMessage(toolResultMessage2);

    const graph = builder.buildGraph();

    expect(graph.nodes.size).toBe(4);
    expect(graph.dependencies.has("news_summarizer")).toBe(true);
    expect(graph.preconditions.get("news_summarizer")!.length).toBeGreaterThanOrEqual(1);
  });

  it("should not add dependencies if no tool calls are present", () => {
    const builder = new ToolCallDependencyGraphBuilder();
    const userMessage = { role: "user", content: "Hello world." };
    const assistantMessage = { role: "assistant", content: "Hello back!" };

    builder.addMessage(userMessage);
    builder.addMessage(assistantMessage);

    const graph = builder.buildGraph();

    expect(graph.nodes.size).toBe(2);
    expect(graph.dependencies.size).toBe(0);
    expect(graph.preconditions.size).toBe(0);
  });
});