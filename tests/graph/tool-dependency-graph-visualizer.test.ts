import { describe, it, expect } from "vitest";
import {
  visualizeDependencyGraph,
  DependencyGraph,
  ToolCall,
  Dependency,
} from "../src/graph/tool-dependency-graph-visualizer";

describe("visualizeDependencyGraph", () => {
  it("should generate correct mermaid syntax for a simple graph", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "node1", name: "toolA", input: {} },
        { id: "node2", name: "toolB", input: {} },
      ],
      edges: [
        { source: "node1", target: "node2", type: "calls" },
      ],
    };

    const result = visualizeDependencyGraph(graph);
    expect(result.mermaidSyntax).toContain("graph TD");
    expect(result.mermaidSyntax).toContain("node1[toolA]");
    expect(result.mermaidSyntax).toContain("node2[toolB]");
    expect(result.mermaidSyntax).toContain("node1 --> node2");
  });

  it("should handle a graph with no dependencies", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "node1", name: "toolA", input: {} },
        { id: "node2", name: "toolB", input: {} },
      ],
      edges: [],
    };

    const result = visualizeDependencyGraph(graph);
    expect(result.mermaidSyntax).toContain("graph TD");
    expect(result.mermaidSyntax).toContain("node1[toolA]");
    expect(result.mermaidSyntax).toContain("node2[toolB]");
    expect(result.mermaidSyntax).not.toContain("-->");
  });

  it("should handle an empty graph", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    const result = visualizeDependencyGraph(graph);
    expect(result.mermaidSyntax).toBe("graph TD");
  });
});