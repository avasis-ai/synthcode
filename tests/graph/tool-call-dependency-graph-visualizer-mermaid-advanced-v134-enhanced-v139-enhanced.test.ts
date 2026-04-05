import { describe, it, expect } from "vitest";
import { GraphContext } from "../types";
import { visualizeToolCallDependencyGraphMermaidAdvancedV134EnhancedV139Enhanced } from "../graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-enhanced";

describe("visualizeToolCallDependencyGraphMermaidAdvancedV134EnhancedV139Enhanced", () => {
  it("should generate a basic graph for a single tool call", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "What is the weather in London?" }
      ],
      toolCalls: [
        { id: "call1", name: "get_weather", input: { location: "London" } }
      ],
      executionTrace: [
        {
          step: 1,
          type: "assistant",
          details: { toolCallId: "call1" },
          outcome: "conditional",
          contextData: {},
        },
        {
          step: 2,
          type: "tool",
          details: { toolCallId: "call1", result: "Sunny" },
          outcome: "success",
          contextData: { weather: "Sunny" },
        }
      ]
    };

    const mermaidCode = visualizeToolCallDependencyGraphMermaidAdvancedV134EnhancedV139Enhanced(context);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User Message]");
    expect(mermaidCode).toContain("B[Tool Call: get_weather]");
    expect(mermaidCode).toContain("C[Tool Result: Sunny]");
  });

  it("should handle multiple sequential tool calls", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "First, get the weather, then find a restaurant." }
      ],
      toolCalls: [
        { id: "call1", name: "get_weather", input: { location: "London" } },
        { id: "call2", name: "find_restaurant", input: { cuisine: "Italian" } }
      ],
      executionTrace: [
        {
          step: 1,
          type: "assistant",
          details: { toolCallId: "call1" },
          outcome: "conditional",
          contextData: {},
        },
        {
          step: 2,
          type: "tool",
          details: { toolCallId: "call1", result: "Sunny" },
          outcome: "success",
          contextData: { weather: "Sunny" },
        },
        {
          step: 3,
          type: "assistant",
          details: { toolCallId: "call2" },
          outcome: "conditional",
          contextData: {},
        },
        {
          step: 4,
          type: "tool",
          details: { toolCallId: "call2", result: "Trattoria" },
          outcome: "success",
          contextData: { restaurant: "Trattoria" },
        }
      ]
    };

    const mermaidCode = visualizeToolCallDependencyGraphMermaidAdvancedV134EnhancedV139Enhanced(context);
    expect(mermaidCode).toContain("call1");
    expect(mermaidCode).toContain("call2");
    expect(mermaidCode).toContain("A[User Message]");
    expect(mermaidCode).toContain("D[Tool Call: find_restaurant]");
  });

  it("should generate an empty graph if no tool calls or execution trace exists", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Hello world." }
      ],
      toolCalls: [],
      executionTrace: []
    };

    const mermaidCode = visualizeToolCallDependencyGraphMermaidAdvancedV134EnhancedV139Enhanced(context);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).not.toContain("Tool Call");
    expect(mermaidCode).not.toContain("Tool Result");
  });
});