import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly generate a basic graph structure from simple messages", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "Hello world" },
      { type: "assistant", content: "Hi there!" },
    ];
    const graphContext = visualizer.generateGraphContext(messages);

    expect(graphContext.nodes).toHaveLength(2);
    expect(graphContext.edges).toHaveLength(1);
    expect(graphContext.nodes.some(n => n.type === "user" && n.label.includes("Hello world"))).toBe(true);
    expect(graphContext.edges[0].from).toBe("user_0");
    expect(graphContext.edges[0].to).toBe("assistant_1");
  });

  it("should handle tool calls and results correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "What is the weather?" },
      { type: "assistant", content: "Tool call for weather", toolUse: { name: "get_weather", args: { location: "London" } } },
      { type: "tool_result", content: "Sunny", toolResult: { name: "get_weather", result: "Sunny" } },
      { type: "assistant", content: "The weather is sunny." },
    ];
    const graphContext = visualizer.generateGraphContext(messages);

    expect(graphContext.nodes).toHaveLength(4);
    expect(graphContext.edges).toHaveLength(3);
    expect(graphContext.nodes.some(n => n.type === "tool" && n.metadata.toolUse?.name === "get_weather")).toBe(true);
    expect(graphContext.nodes.some(n => n.type === "tool" && n.metadata.toolResult?.name === "get_weather")).toBe(true);
    expect(graphContext.edges.some(e => e.from === "user_0" && e.to === "tool_1")).toBe(true);
  });

  it("should generate a mermaid diagram string", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const messages = [
      { type: "user", content: "Start" },
      { type: "assistant", content: "Next step", toolUse: { name: "some_tool", args: {} } },
      { type: "tool_result", content: "Result", toolResult: { name: "some_tool", result: "Success" } },
    ];
    const mermaidDiagram = visualizer.generateMermaidDiagram(messages);

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[Start]");
    expect(mermaidDiagram).toContain("B[Tool Call]");
    expect(mermaidDiagram).toContain("C[Tool Result]");
  });
});