import { describe, it, expect } from "vitest";
import { BaseGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v1";
import { MockRendererStrategy } from "../src/graph/mock-renderer-strategy";

describe("BaseGraphVisualizer", () => {
  it("should initialize with a renderer strategy", () => {
    const mockRenderer = new MockRendererStrategy();
    const visualizer = new BaseGraphVisualizer(mockRenderer);
    expect(visualizer).toBeDefined();
  });

  it("should correctly generate graph structure with basic nodes and edges", () => {
    const mockRenderer = new MockRendererStrategy();
    const visualizer = new BaseGraphVisualizer(mockRenderer);

    const nodes = [
      { id: "user1", label: "User Input", type: "user", metadata: {} },
      { id: "assistant1", label: "Assistant Response", type: "assistant", metadata: {} },
    ];
    const edges = [
      { fromId: "user1", toId: "assistant1", label: "calls" },
    ];

    const mermaidCode = visualizer.generateGraph(nodes, edges);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user1[User Input]");
    expect(mermaidCode).toContain("assistant1[Assistant Response]");
    expect(mermaidCode).toContain("user1 -->|calls| assistant1");
  });

  it("should handle complex graph structures including tool calls", () => {
    const mockRenderer = new MockRendererStrategy();
    const visualizer = new BaseGraphVisualizer(mockRenderer);

    const nodes = [
      { id: "start", label: "Start", type: "start", metadata: {} },
      { id: "tool_call", label: "Tool Call", type: "tool_use", metadata: { toolName: "search" } },
      { id: "result", label: "Tool Result", type: "tool_result", metadata: { result: "data" } },
      { id: "end", label: "End", type: "end", metadata: {} },
    ];
    const edges = [
      { fromId: "start", toId: "tool_call", label: "triggers" },
      { fromId: "tool_call", toId: "result", label: "returns" },
      { fromId: "result", toId: "end", label: "completes" },
    ];

    const mermaidCode = visualizer.generateGraph(nodes, edges);

    expect(mermaidCode).toContain("tool_call[Tool Call]");
    expect(mermaidCode).toContain("result[Tool Result]");
    expect(mermaidCode).toContain("start -->|triggers| tool_call");
    expect(mermaidCode).toContain("tool_call -->|returns| result");
  });
});