import { describe, it, expect } from "vitest";
import { SemanticContextGraphMergerV4 } from "../src/schema/semantic-context-graph-merger-v4";
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/schema/types";

describe("SemanticContextGraphMergerV4", () => {
  it("should correctly merge a simple sequence of messages into a graph", async () => {
    const messages: (UserMessage | AssistantMessage | ToolResultMessage)[] = [
      {
        role: "user",
        content: "What is the capital of France?",
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: "The capital of France is Paris.",
        timestamp: new Date(),
      },
    ];

    const merger = new SemanticContextGraphMergerV4();
    const graph = await merger.merge(messages);

    expect(graph.nodes.size).toBeGreaterThanOrEqual(2);
    expect(graph.edges.size).toBeGreaterThan(0);
    // Basic check to ensure nodes/edges exist after merging
    expect(graph.nodes.get("user_query")).toBeDefined();
  });

  it("should handle multiple turns with tool results", async () => {
    const messages: (UserMessage | AssistantMessage | ToolResultMessage)[] = [
      {
        role: "user",
        content: "What is the weather in London?",
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: "I need to check the weather.",
        timestamp: new Date(),
      },
      {
        role: "tool_result",
        toolName: "weather_api",
        result: { temperature: "15C", condition: "Cloudy" },
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: "It is currently 15C and Cloudy in London.",
        timestamp: new Date(),
      },
    ];

    const merger = new SemanticContextGraphMergerV4();
    const graph = await merger.merge(messages);

    // Expect at least 4 distinct entities/nodes (user query, assistant intent, tool call, final answer)
    expect(graph.nodes.size).toBeGreaterThanOrEqual(4);
    // Expect edges connecting the flow (user -> assistant -> tool -> assistant)
    expect(graph.edges.size).toBeGreaterThan(2);
  });

  it("should maintain graph integrity when provided with empty or single messages", async () => {
    // Test with no messages
    const mergerEmpty = new SemanticContextGraphMergerV4();
    const graphEmpty = await mergerEmpty.merge([]);
    expect(graphEmpty.nodes.size).toBe(0);
    expect(graphEmpty.edges.size).toBe(0);

    // Test with a single message
    const mergerSingle = new SemanticContextGraphMergerV4();
    const messagesSingle: (UserMessage | AssistantMessage | ToolResultMessage)[] = [
      {
        role: "user",
        content: "Hello world",
        timestamp: new Date(),
      },
    ];
    const graphSingle = await mergerSingle.merge(messagesSingle);
    expect(graphSingle.nodes.size).toBeGreaterThan(0);
    expect(graphSingle.edges.size).toBe(0); // No edges possible with one message
  });
});