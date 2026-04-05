import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV101 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v101";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV101", () => {
  it("should generate a basic graph structure for a simple user-assistant interaction", () => {
    const config = {
      messages: [
        { role: "user", content: "Hello world" } as any,
        { role: "assistant", content: "Hi there!" } as any,
      ],
      graphTitle: "Simple Chat Flow",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV101(config);
    const mermaidCode = visualizer.generateMermaid(config);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User: Hello world]");
    expect(mermaidCode).toContain("B[Assistant: Hi there!]");
  });

  it("should correctly include a tool call and result in the graph", () => {
    const config = {
      messages: [
        {
          role: "user",
          content: "What is the weather in London?",
          toolCalls: [{ name: "get_weather", args: { location: "London" } }] as any,
        } as any,
        {
          role: "tool_result",
          content: "{\"temperature\": \"15C\"}",
          toolUse: { name: "get_weather", result: "{\"temperature\": \"15C\"}" } as any,
        } as any,
        { role: "assistant", content: "The weather is 15C." } as any,
      ],
      graphTitle: "Weather Check Flow",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV101(config);
    const mermaidCode = visualizer.generateMermaid(config);
    expect(mermaidCode).toContain("ToolCall[User calls get_weather]");
    expect(mermaidCode).toContain("ToolResult[Tool returns data]");
    expect(mermaidCode).toContain("A --> B"); // Check for flow connection
  });

  it("should handle a complex sequence with multiple tool uses", () => {
    const config = {
      messages: [
        {
          role: "user",
          content: "First, get the user's profile, then check their recent orders.",
          toolCalls: [{ name: "get_profile", args: {} }] as any,
        } as any,
        {
          role: "tool_result",
          content: "{\"user_id\": \"u123\"}",
          toolUse: { name: "get_profile", result: "{\"user_id\": \"u123\"}" } as any,
        } as any,
        {
          role: "user",
          content: "Now check orders for u123.",
          toolCalls: [{ name: "get_orders", args: { user_id: "u123" } }] as any,
        } as any,
        {
          role: "tool_result",
          content: "[{\"id\": 1}, {\"id\": 2}]",
          toolUse: { name: "get_orders", result: "[{\"id\": 1}, {\"id\": 2}]" } as any,
        } as any,
      ],
      graphTitle: "Multi-Step Tool Workflow",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV101(config);
    const mermaidCode = visualizer.generateMermaid(config);
    expect(mermaidCode).toContain("ToolCall[User calls get_profile]");
    expect(mermaidCode).toContain("ToolCall[User calls get_orders]");
    expect(mermaidCode).toContain("get_profile");
    expect(mermaidCode).toContain("get_orders");
  });
});