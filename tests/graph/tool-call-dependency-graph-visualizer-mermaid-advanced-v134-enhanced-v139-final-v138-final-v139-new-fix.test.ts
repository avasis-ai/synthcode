import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v138-final-v139-new-fix";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic mermaid graph for a simple sequence of calls", () => {
    const graph = {
      nodes: new Map([
        ["user_1", { id: "user_1", type: "user", content: "What is the weather?" }],
        ["assistant_1", { id: "assistant_1", type: "assistant", content: "I can check the weather for you." }],
        ["tool_result_1", { id: "tool_result_1", type: "tool_result", content: "Sunny with a high of 25C." }],
      ]),
      edges: [
        { from: "user_1", to: "assistant_1", type: "call" },
        { from: "assistant_1", to: "tool_result_1", type: "dependency" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(graph);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user_1 --> assistant_1");
    expect(mermaidCode).toContain("assistant_1 --> tool_result_1");
  });

  it("should handle conditional dependencies correctly", () => {
    const graph = {
      nodes: new Map([
        ["user_1", { id: "user_1", type: "user", content: "Check stock for product A." }],
        ["assistant_1", { id: "assistant_1", type: "assistant", content: "Calling stock API." }],
        ["tool_result_1", { id: "tool_result_1", type: "tool_result", content: "Product A is in stock." }],
        ["conditional_path", { id: "conditional_path", type: "assistant", content: "If stock > 0, then..." }],
      ]),
      edges: [
        { from: "user_1", to: "assistant_1", type: "call" },
        { from: "assistant_1", to: "tool_result_1", type: "dependency", condition: "stock > 0" },
        { from: "tool_result_1", to: "conditional_path", type: "conditional", condition: "stock > 0" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(graph);
    expect(mermaidCode).toContain("conditional_path");
    expect(mermaidCode).toContain("dependency with condition: stock > 0");
  });

  it("should generate an empty graph if no nodes or edges are present", () => {
    const graph: any = {
      nodes: new Map(),
      edges: [],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateMermaid(graph);
    expect(mermaidCode).toBe("graph TD\n\n// No dependencies to visualize");
  });
});