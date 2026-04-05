import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV4 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v4";
import { DependencyGraph, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../src/graph/dependency-graph-visualizer-base";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV4", () => {
  it("should correctly generate a basic graph structure for a simple tool call sequence", () => {
    const graph = new DependencyGraph([
      new ThinkingBlock("Thinking", "Thinking process started."),
      new ToolUseBlock("ToolA", "ToolA", { input: "data1" }),
      new Message("Message", "Success message."),
    ]);
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV4(graph);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("Thinking");
    expect(mermaidCode).toContain("ToolA");
    expect(mermaidCode).toContain("Message");
  });

  it("should handle complex graphs with multiple content blocks and different dependencies", () => {
    const graph = new DependencyGraph([
      new TextBlock("Start", "Initial text."),
      new ThinkingBlock("Thinking1", "Step 1 thinking."),
      new ToolUseBlock("ToolB", "ToolB", { input: "data2" }),
      new ContentBlock("Content1", "Content A", [
        new TextBlock("SubText", "Sub text info")
      ]),
      new ToolUseBlock("ToolC", "ToolC", { input: "data3" }),
    ]);
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV4(graph);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("Start");
    expect(mermaidCode).toContain("ToolB");
    expect(mermaidCode).toContain("ToolC");
    expect(mermaidCode).toContain("Content1");
  });

  it("should generate correct links and labels between nodes", () => {
    const graph = new DependencyGraph([
      new ThinkingBlock("StartThink", "Start thinking."),
      new ToolUseBlock("ToolX", "ToolX", { input: "data" }),
      new Message("EndMsg", "Finished."),
    ]);
    // Manually setting up dependencies for testing link generation logic if possible, 
    // but relying on the visualizer's internal logic based on the graph structure.
    // For this test, we check for the presence of expected connections.
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV4(graph);
    const mermaidCode = visualizer.generateMermaidCode();

    expect(mermaidCode).toContain("StartThink --> ToolX");
    expect(mermaidCode).toContain("ToolX --> EndMsg");
  });
});