import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV135EnhancedV3 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135-enhanced-v3";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV135EnhancedV3", () => {
  it("should generate a basic graph structure for a simple user-assistant interaction", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV135EnhancedV3();
    const messages = [
      { type: "user", content: "Hello world" },
      { type: "assistant", content: "Hi there!" },
    ];
    const mermaidCode = visualizer.generateGraph(messages);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User: Hello world]");
    expect(mermaidCode).toContain("B[Assistant: Hi there!]");
    expect(mermaidCode).toContain("A --> B");
  });

  it("should include tool call and response nodes when tools are used", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV135EnhancedV3();
    const messages = [
      { type: "user", content: "Get weather for London" },
      { type: "assistant", content: "ToolCall: get_weather", tool_calls: [{ name: "get_weather", args: { location: "London" } }] },
      { type: "tool_result", content: "{\"temperature\": 15, \"unit\": \"C\"}", tool_name: "get_weather" },
      { type: "assistant", content: "The weather in London is 15C." },
    ];
    const mermaidCode = visualizer.generateGraph(messages);

    expect(mermaidCode).toContain("ToolCall: get_weather");
    expect(mermaidCode).toContain("ToolResult: get_weather");
    expect(mermaidCode).toContain("User --> ToolCall");
    expect(mermaidCode).toContain("ToolCall --> ToolResult");
    expect(mermaidCode).toContain("ToolResult --> Assistant");
  });

  it("should handle complex flow control with conditional edges", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV135EnhancedV3();
    const messages = [
      { type: "user", content: "Check status" },
      { type: "assistant", content: "ToolCall: check_status", tool_calls: [{ name: "check_status", args: {} }] },
      { type: "tool_result", content: "{\"status\": \"success\"}", tool_name: "check_status" },
      { type: "assistant", content: "Status is success.", flow_control: { type: "conditional", condition: "status == 'success'" } },
    ];
    const mermaidCode = visualizer.generateGraph(messages);

    expect(mermaidCode).toContain("Conditional Edge");
    expect(mermaidCode).toContain("ToolResult --> ConditionalEdge");
    expect(mermaidCode).toContain("ConditionalEdge --[status == 'success']--> FinalOutput");
  });
});