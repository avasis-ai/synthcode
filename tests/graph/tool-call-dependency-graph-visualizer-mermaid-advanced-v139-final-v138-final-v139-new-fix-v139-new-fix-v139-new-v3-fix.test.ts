import { describe, it, expect } from "vitest";
import {
  GraphContext,
  GraphVisualizer,
  GraphVisualizerOptions,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v3-fix";

describe("GraphVisualizer", () => {
  it("should generate a basic graph structure for simple message exchange", async () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Hello world" } as UserMessage,
        { role: "assistant", content: "Hi there!" } as AssistantMessage,
      ],
      graphTitle: "Simple Chat",
      mermaidGraphType: "graph TD",
      metadataHooks: {},
    };

    const visualizer = new GraphVisualizer(context, {
      graphTitle: "Simple Chat",
      mermaidGraphType: "graph TD",
    });

    const mermaidCode = await visualizer.generateGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User: Hello world]");
    expect(mermaidCode).toContain("B[Assistant: Hi there!]");
    expect(mermaidCode).toContain("A --> B");
  });

  it("should handle tool use and result messages correctly", async () => {
    const context: GraphContext = {
      messages: [
        {
          role: "user",
          content: "What is the weather?",
          toolUses: [{
            toolName: "get_weather",
            args: { location: "Tokyo" },
          }] as any,
        } as UserMessage,
        {
          role: "tool",
          content: "{\"temperature\": \"25C\"}" as any,
          toolResult: {
            toolName: "get_weather",
            result: "{\"temperature\": \"25C\"}",
          } as any,
        } as ToolResultMessage,
        { role: "assistant", content: "The weather is 25C in Tokyo." } as AssistantMessage,
      ],
      graphTitle: "Tool Call Example",
      mermaidGraphType: "graph LR",
      metadataHooks: {},
    };

    const visualizer = new GraphVisualizer(context, {
      graphTitle: "Tool Call Example",
      mermaidGraphType: "graph LR",
    });

    const mermaidCode = await visualizer.generateGraph();

    expect(mermaidCode).toContain("graph LR");
    expect(mermaidCode).toContain("A[User: What is the weather?] --> B{Tool Call: get_weather}");
    expect(mermaidCode).toContain("B --> C[Tool Result: {\"temperature\": \"25C\"}]");
    expect(mermaidCode).toContain("C --> D[Assistant: The weather is 25C in Tokyo.]");
  });

  it("should incorporate metadata hooks if provided", async () => {
    const context: GraphContext = {
      messages: [{ role: "user", content: "Test" } as UserMessage],
      graphTitle: "Hook Test",
      mermaidGraphType: "graph TD",
      metadataHooks: {
        onStart: jest.fn((context) => `START_HOOK(${context.graphTitle})`),
        onEnd: jest.fn((context) => `END_HOOK(${context.graphTitle})`),
        onNodeProcess: jest.fn((nodeId, context) => `NODE_HOOK(${nodeId})`),
        onEdgeProcess: jest.fn((fromId, toId) => `EDGE_HOOK(${fromId},${toId})`),
      },
    };

    const visualizer = new GraphVisualizer(context, {
      graphTitle: "Hook Test",
      mermaidGraphType: "graph TD",
    });

    const mermaidCode = await visualizer.generateGraph();

    expect(mermaidCode).toContain("START_HOOK(Hook Test)");
    expect(mermaidCode).toContain("END_HOOK(Hook Test)");
    // Check if node and edge hooks are called (checking for the hook function call in the output)
    expect(mermaidCode).toContain("NODE_HOOK(A)");
    expect(mermaidCode).toContain("EDGE_HOOK(A,B)");
  });
});