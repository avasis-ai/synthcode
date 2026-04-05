import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV2 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v2";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV2", () => {
  it("should correctly generate mermaid graph for a simple success flow", () => {
    const statusMap: { [key: string]: "SUCCESS" | "FAILURE" | "SKIPPED" | "PENDING" } = {
      "tool_a": "SUCCESS",
      "tool_b": "SUCCESS",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(statusMap);
    const graph = visualizer.generateGraph("tool_a", "tool_b", "tool_a", "tool_b");

    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[Tool A]");
    expect(graph).toContain("B[Tool B]");
    expect(graph).toContain("A --> B");
  });

  it("should handle a failure in the first tool call", () => {
    const statusMap: { [key: string]: "SUCCESS" | "FAILURE" | "SKIPPED" | "PENDING" } = {
      "tool_a": "FAILURE",
      "tool_b": "SUCCESS",
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(statusMap);
    const graph = visualizer.generateGraph("tool_a", "tool_b", "tool_a", "tool_b");

    expect(graph).toContain("A[Tool A]");
    expect(graph).toContain("B[Tool B]");
    // Expecting the dependency to be shown, but the failure status might affect styling/edges
    expect(graph).toContain("A --> B");
  });

  it("should generate an empty graph if no tools are provided", () => {
    const statusMap: { [key: string]: "SUCCESS" | "FAILURE" | "SKIPPED" | "PENDING" } = {};
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV2(statusMap);
    const graph = visualizer.generateGraph("", "", "", "");

    expect(graph).toBe("");
  });
});