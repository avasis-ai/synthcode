import { describe, it, expect } from "vitest";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/debugger/synth-code-types";
import {
  GraphEdge,
  GraphNode,
  buildDependencyGraph,
} from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v143";

describe("buildDependencyGraph", () => {
  it("should build a basic graph from a simple conversation", () => {
    const messages: Message[] = [
      UserMessage("Hello world"),
      AssistantMessage(
        {
          type: "thinking",
          content: [
            { type: "text", content: "Thinking about the response." },
          ],
        },
      ),
      AssistantMessage(
        {
          type: "tool_use",
          content: [
            {
              type: "tool_use",
              tool_use: {
                tool_name: "get_weather",
                tool_input: { location: "San Francisco" },
              },
            },
          ],
        },
      ),
      ToolResultMessage(
        {
          type: "tool_result",
          content: [
            { type: "text", content: "The weather is sunny." },
          ],
        },
      ),
    ];

    const graph = buildDependencyGraph(messages);

    expect(graph).toHaveProperty("nodes");
    expect(graph).toHaveProperty("edges");

    // Check if at least the main components are present
    expect(graph.nodes).some((node) => node.type === "USER_INPUT");
    expect(graph.nodes).some((node) => node.type === "ASSISTANT_THOUGHT");
    expect(graph.nodes).some((node) => node.type === "TOOL_CALL");
    expect(graph.nodes).some((node) => node.type === "TOOL_RESULT");

    // Check for at least one edge
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it("should handle a graph with no tool calls", () => {
    const messages: Message[] = [
      UserMessage("What is the capital of France?"),
      AssistantMessage(
        {
          type: "thinking",
          content: [
            { type: "text", content: "The capital of France is Paris." },
          ],
        },
      ),
    ];

    const graph = buildDependencyGraph(messages);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].dependencyType).toBe("CALL");
  });

  it("should correctly link user input to the first assistant response", () => {
    const messages: Message[] = [
      UserMessage("Tell me about dependency graphs."),
      AssistantMessage(
        {
          type: "thinking",
          content: [
            { type: "text", content: "Dependency graphs are useful." },
          ],
        },
      ),
    ];

    const graph = buildDependencyGraph(messages);

    // Expect an edge from USER_INPUT to ASSISTANT_THOUGHT
    const userToThoughtEdge = graph.edges.find(
      (edge) =>
        edge.from.includes("USER_INPUT") &&
        edge.to.includes("ASSISTANT_THOUGHT"),
    );

    expect(userToThoughtEdge).toBeDefined();
    expect(userToThoughtEdge!.dependencyType).toBe("INPUT");
  });
});