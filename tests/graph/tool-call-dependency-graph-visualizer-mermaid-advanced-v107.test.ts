import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v107";

describe("ToolCallDependencyGraphVisualizer", () => {
  const visualizer = new ToolCallDependencyGraphVisualizer();

  it("should generate a basic graph for a single tool call", () => {
    const config = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", content: "What is the weather?" }
          ]
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              toolUse: {
                toolName: "get_weather",
                toolInput: { location: "New York" }
              }
            }
          ]
        }
      ],
    };
    const mermaidGraph = visualizer.generateMermaidGraph(config);
    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("A[User: What is the weather?] --> B{Tool: get_weather}");
  });

  it("should generate a graph with multiple turns and tool calls", () => {
    const config = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", content: "Plan a trip to Paris." }
          ]
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              toolUse: {
                toolName: "search_flights",
                toolInput: { destination: "Paris" }
              }
            }
          ]
        },
        {
          role: "model",
          content: [
            { type: "text", content: "I found some flights." }
          ]
        }
      ],
    };
    const mermaidGraph = visualizer.generateMermaidGraph(config);
    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("A[User: Plan a trip to Paris.] --> B{Tool: search_flights}");
    expect(mermaidGraph).toContain("B --> C[Model: I found some flights.]");
  });

  it("should handle empty message history gracefully", () => {
    const config = {
      messages: [],
    };
    const mermaidGraph = visualizer.generateMermaidGraph(config);
    expect(mermaidGraph).toBe("graph TD\n"); // Or an empty/minimal graph structure expected by the implementation
  });
});