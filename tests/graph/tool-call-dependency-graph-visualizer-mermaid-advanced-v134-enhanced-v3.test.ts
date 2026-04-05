import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v3";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3", () => {
  it("should generate a basic graph structure from a simple sequence of messages", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3();
    const messages = [
      new UserMessage("Initial query"),
      new AssistantMessage("Response with tool call"),
    ];
    const mermaidCode = visualizer.generateMermaid(messages);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("User -> Assistant");
  });

  it("should handle multiple tool calls and results correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3();
    const messages = [
      new UserMessage("Query requiring tool A"),
      new AssistantMessage("Calling Tool A"),
      new ToolResultMessage("Tool A result", "toolA"),
      new AssistantMessage("Final response using Tool A result"),
    ];
    const mermaidCode = visualizer.generateMermaid(messages);
    expect(mermaidCode).toContain("Tool A Call");
    expect(mermaidCode).toContain("Tool A Result");
    expect(mermaidCode).toContain("Assistant -> Final response");
  });

  it("should apply custom styling when provided in the configuration", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3();
    const messages = [
      new UserMessage("Styled query"),
      new AssistantMessage("Styled response"),
    ];
    const config = {
      defaultNodeClass: "styled-node",
      edgeStyles: {
        default: "stroke: blue, stroke-width: 2px",
      },
    };
    const mermaidCode = visualizer.generateMermaid(messages, config);
    expect(mermaidCode).toContain("classDef styled-node fill:#f9f,stroke:#333,stroke-width:2px");
    expect(mermaidCode).toContain("linkStyle default stroke: blue, stroke-width: 2px");
  });
});