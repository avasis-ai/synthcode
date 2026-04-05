import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV122 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v122";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV122", () => {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV122();

  it("should generate a basic graph for a simple user-assistant exchange", () => {
    const config = {
      messages: [
        { type: "user", content: "Hello world" } as any,
        { type: "assistant", content: "Hi there!" } as any,
      ],
      mermaidGraphType: "graph TD",
    };
    const mermaid = visualizer.generateMermaid(config);
    expect(mermaid).toContain("A[User: Hello world]");
    expect(mermaid).toContain("B[Assistant: Hi there!]");
    expect(mermaid).toContain("A --> B");
  });

  it("should handle a sequence involving a tool call and result", () => {
    const config = {
      messages: [
        { type: "user", content: "What is the weather?" } as any,
        { type: "assistant", content: "ToolCall: get_weather", tool_use: { name: "get_weather", input: "London" } } as any,
        { type: "tool_result", content: "Weather in London is 20C" } as any,
      ],
      mermaidGraphType: "graph TD",
    };
    const mermaid = visualizer.generateMermaid(config);
    expect(mermaid).toContain("A[User: What is the weather?]");
    expect(mermaid).toContain("B[Assistant: ToolCall: get_weather]");
    expect(mermaid).toContain("C[ToolResult: Weather in London is 20C]");
    expect(mermaid).toContain("A --> B");
    expect(mermaid).toContain("B --> C");
  });

  it("should generate a graph with multiple steps including thinking and tool use", () => {
    const config = {
      messages: [
        { type: "user", content: "Plan a trip to Paris." } as any,
        { type: "assistant", content: "Thinking: I need to check flights and hotels." } as any,
        { type: "assistant", content: "ToolCall: search_flights", tool_use: { name: "search_flights", input: "Paris" } } as any,
        { type: "tool_result", content: "Flights found." } as any,
        { type: "assistant", content: "Thinking: Now I will suggest hotels." } as any,
      ],
      mermaidGraphType: "graph TD",
    };
    const mermaid = visualizer.generateMermaid(config);
    expect(mermaid).toContain("A[User: Plan a trip to Paris.]");
    expect(mermaid).toContain("B[Assistant: Thinking: I need to check flights and hotels.]");
    expect(mermaid).toContain("C[Assistant: ToolCall: search_flights]");
    expect(mermaid).toContain("D[ToolResult: Flights found.]");
    expect(mermaid).toContain("E[Assistant: Thinking: Now I will suggest hotels.]");
    expect(mermaid).toContain("B --> C");
    expect(mermaid).toContain("C --> D");
    expect(mermaid).toContain("D --> E");
  });
});