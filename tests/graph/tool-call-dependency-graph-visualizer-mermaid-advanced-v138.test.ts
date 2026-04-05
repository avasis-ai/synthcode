import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV138 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v138";
import { DependencyNode, DependencyEdge } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV138", () => {
  it("should correctly initialize with provided nodes and edges", () => {
    const nodes: DependencyNode[] = [
      { id: "user1", type: "user", content: "Hello", metadata: {} },
      { id: "assistant1", type: "assistant", content: "Hi there", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromId: "user1", toId: "assistant1" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV138(nodes, edges);
    // Assuming the constructor sets internal state correctly, we test if it's instantiated.
    expect(visualizer).toBeDefined();
  });

  it("should generate a basic Mermaid graph structure for simple dependencies", () => {
    const nodes: DependencyNode[] = [
      { id: "start", type: "user", content: "Start", metadata: {} },
      { id: "end", type: "assistant", content: "End", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromId: "start", toId: "end" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV138(nodes, edges);
    const mermaidCode = visualizer.generateMermaidGraph();
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start --> end");
  });

  it("should handle tool calls and data flow visualization", () => {
    const nodes: DependencyNode[] = [
      { id: "user", type: "user", content: "Get weather", metadata: {} },
      { id: "tool_call", type: "tool", content: "weather_api", metadata: {} },
      { id: "tool_result", type: "assistant", content: "Sunny", metadata: {} },
    ];
    const edges: DependencyEdge[] = [
      { fromId: "user", toId: "tool_call", dataFlow: "input_query" },
      { fromId: "tool_call", toId: "tool_result", dataFlow: "output_data" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV138(nodes, edges);
    const mermaidCode = visualizer.generateMermaidGraph();
    expect(mermaidCode).toContain("tool_call");
    expect(mermaidCode).toContain("user --> tool_call");
    expect(mermaidCode).toContain("tool_call --> tool_result");
    expect(mermaidCode).toContain("dataFlow: input_query");
  });
});