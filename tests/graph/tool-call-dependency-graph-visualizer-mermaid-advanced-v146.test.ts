import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV146 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v146";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV146", () => {
  it("should generate a basic graph for a simple sequence of messages", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV146();
    const messages = [
      { role: "user", content: { type: "text", text: "Hello" } },
      { role: "assistant", content: { type: "text", text: "Hi there!" } },
    ];
    const mermaidCode = visualizer.generateMermaid(messages, []);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User: Hello]");
    expect(mermaidCode).toContain("B[Assistant: Hi there!]");
  });

  it("should handle a graph with a tool call dependency", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV146();
    const messages = [
      { role: "user", content: { type: "text", text: "Get weather for London" } },
      { role: "assistant", content: { type: "tool_use", toolName: "get_weather", toolInput: { location: "London" } } },
    ];
    const mermaidCode = visualizer.generateMermaid(messages, []);
    expect(mermaidCode).toContain("A[User: Get weather for London]");
    expect(mermaidCode).toContain("B{Tool Call: get_weather}");
  });

  it("should generate a graph with conditional branching", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV146();
    const messages = [
      { role: "user", content: { type: "text", text: "Check stock" } },
      // Simulate a path that leads to a condition
      { role: "assistant", content: { type: "tool_use", toolName: "check_stock", toolInput: { item: "Laptop" } } },
      // Assume the next step depends on the tool output
    ];
    const mermaidCode = visualizer.generateMermaid(messages, []);
    expect(mermaidCode).toContain("A[User: Check stock]");
    expect(mermaidCode).toContain("B{Tool Call: check_stock}");
    // Check for a structure suggesting branching logic if the implementation supports it
    expect(mermaidCode).toContain("-->");
  });
});