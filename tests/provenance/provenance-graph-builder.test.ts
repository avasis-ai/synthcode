import { describe, it, expect } from "vitest";
import { buildProvenanceGraph } from "../src/provenance/provenance-graph-builder";

describe("buildProvenanceGraph", () => {
  it("should build a basic graph from simple messages", async () => {
    const messages = [
      {
        role: "user",
        content: "Hello world",
        sourceId: "user-input-1",
      },
      {
        role: "assistant",
        content: "Hello there!",
        sourceId: "assistant-response-1",
      },
    ];

    const graph = await buildProvenanceGraph(messages);

    expect(graph).toHaveProperty("nodes");
    expect(graph.nodes.length).toBe(2);
    expect(graph.nodes[0].sourceId).toBe("user-input-1");
    expect(graph.nodes[1].sourceId).toBe("assistant-response-1");
  });

  it("should handle complex interactions including tool use and thinking steps", async () => {
    const messages = [
      {
        role: "user",
        content: "What is the weather?",
        sourceId: "user-input-weather",
      },
      {
        role: "assistant",
        content: "Thinking about the weather...",
        sourceId: "thinking-step-1",
      },
      {
        role: "tool_use",
        toolName: "weather_api",
        toolInput: { location: "London" },
        sourceId: "tool-call-1",
      },
      {
        role: "tool_result",
        toolName: "weather_api",
        toolResult: { temperature: "15C" },
        sourceId: "tool-result-1",
      },
      {
        role: "assistant",
        content: "It is 15C in London.",
        sourceId: "final-response-2",
      },
    ];

    const graph = await buildProvenanceGraph(messages);

    expect(graph).toHaveProperty("nodes");
    expect(graph.nodes.length).toBe(5);
    expect(graph.nodes.some(node => node.sourceId === "tool-call-1" && node.type === "ToolUse")).toBe(true);
    expect(graph.nodes.some(node => node.sourceId === "tool-result-1" && node.type === "ToolResult")).toBe(true);
  });

  it("should correctly link nodes in a multi-step conversation", async () => {
    const messages = [
      {
        role: "user",
        content: "First step",
        sourceId: "user-step-1",
      },
      {
        role: "assistant",
        content: "Second step",
        sourceId: "assistant-step-2",
      },
      {
        role: "user",
        content: "Third step",
        sourceId: "user-step-3",
      },
    ];

    const graph = await buildProvenanceGraph(messages);

    expect(graph).toHaveProperty("edges");
    expect(graph.edges.length).toBe(2);
    expect(graph.edges[0].sourceNodeId).toBe("user-step-1");
    expect(graph.edges[0].targetNodeId).toBe("assistant-step-2");
    expect(graph.edges[1].sourceNodeId).toBe("assistant-step-2");
    expect(graph.edges[1].targetNodeId).toBe("user-step-3");
  });
});