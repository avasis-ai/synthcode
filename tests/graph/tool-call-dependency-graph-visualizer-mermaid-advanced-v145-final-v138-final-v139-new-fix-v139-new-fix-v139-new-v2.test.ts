import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphVisualizerMermaidAdvancedV145FinalV138FinalV139NewFixV139NewFixV139NewV2,
} from "../graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v145-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v2";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV145FinalV138FinalV139NewFixV139NewFixV139NewV2", () => {
  it("should generate a basic graph for a simple user-assistant interaction", () => {
    const nodes = [
      { id: "user1", type: "user", metadata: { role: "user" }, content: "Hello world" },
      { id: "assistant1", type: "assistant", metadata: { role: "assistant" }, content: "Hi there!" },
    ];
    const edges = [
      { fromNodeId: "user1", toNodeId: "assistant1", dependencyType: "direct", metadata: {} },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145FinalV138FinalV139NewFixV139NewFixV139NewV2();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("user1[user] --> assistant1[assistant]");
  });

  it("should generate a graph including a tool call and result", () => {
    const nodes = [
      { id: "user1", type: "user", metadata: { role: "user" }, content: "Get weather for London" },
      { id: "assistant1", type: "assistant", metadata: { role: "assistant" }, content: "Calling tool: weather_api" },
      { id: "tool_call1", type: "tool_call", metadata: { toolName: "weather_api" }, content: "Tool use" },
      { id: "tool_result1", type: "tool_result", metadata: { toolName: "weather_api" }, content: "Sunny in London" },
    ];
    const edges = [
      { fromNodeId: "user1", toNodeId: "assistant1", dependencyType: "direct", metadata: {} },
      { fromNodeId: "assistant1", toNodeId: "tool_call1", dependencyType: "direct", metadata: {} },
      { fromNodeId: "tool_call1", toNodeId: "tool_result1", dependencyType: "direct", metadata: {} },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145FinalV138FinalV139NewFixV139NewFixV139NewV2();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("tool_call1");
    expect(mermaidDiagram).toContain("tool_result1");
    expect(mermaidDiagram).toContain("tool_call1 --> tool_result1");
  });

  it("should handle conditional and fallback dependencies", () => {
    const nodes = [
      { id: "user1", type: "user", metadata: { role: "user" }, content: "What if the tool fails?" },
      { id: "assistant1", type: "assistant", metadata: { role: "assistant" }, content: "Try tool A, otherwise try tool B." },
      { id: "tool_callA", type: "tool_call", metadata: { toolName: "toolA" }, content: "Call A" },
      { id: "tool_resultA", type: "tool_result", metadata: { toolName: "toolA" }, content: "Result A" },
      { id: "tool_callB", type: "tool_call", metadata: { toolName: "toolB" }, content: "Call B" },
      { id: "tool_resultB", type: "tool_result", metadata: { toolName: "toolB" }, content: "Result B" },
    ];
    const edges = [
      { fromNodeId: "user1", toNodeId: "assistant1", dependencyType: "direct", metadata: {} },
      { fromNodeId: "assistant1", toNodeId: "tool_callA", dependencyType: "direct", metadata: {} },
      { fromNodeId: "tool_callA", toNodeId: "tool_resultA", dependencyType: "direct", metadata: {} },
      { fromNodeId: "tool_resultA", toNodeId: "tool_callB", dependencyType: "fallback", metadata: {} },
      { fromNodeId: "tool_callB", toNodeId: "tool_resultB", dependencyType: "direct", metadata: {} },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV145FinalV138FinalV139NewFixV139NewFixV139NewV2();
    const mermaidDiagram = visualizer.generateMermaid(nodes, edges);

    expect(mermaidDiagram).toContain("fallback");
    expect(mermaidDiagram).toContain("tool_resultA --> tool_callB");
  });
});