import { describe, it, expect } from "vitest";
import { DependencyGraphPayload } from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v137";
import { ContextAnalyzer } from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v137";

describe("ContextAnalyzer", () => {
  it("should correctly analyze a simple set of nodes and edges", () => {
    const contextAnalyzer = new ContextAnalyzer();
    const payload: DependencyGraphPayload = {
      nodes: [
        { id: "nodeA", label: "Node A", type: "tool", metadata: {} },
        { id: "nodeB", label: "Node B", type: "context", metadata: {} },
      ],
      edges: [
        { source: "nodeA", target: "nodeB", relationship: "uses", strength: 0.8 },
      ],
    };
    const result = contextAnalyzer.analyze(payload);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it("should handle an empty payload gracefully", () => {
    const contextAnalyzer = new ContextAnalyzer();
    const payload: DependencyGraphPayload = {
      nodes: [],
      edges: [],
    };
    const result = contextAnalyzer.analyze(payload);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it("should correctly process multiple complex dependencies", () => {
    const contextAnalyzer = new ContextAnalyzer();
    const payload: DependencyGraphPayload = {
      nodes: [
        { id: "tool1", label: "Tool 1", type: "tool", metadata: {} },
        { id: "contextX", label: "Context X", type: "context", metadata: {} },
        { id: "tool2", label: "Tool 2", type: "tool", metadata: {} },
      ],
      edges: [
        { source: "tool1", target: "contextX", relationship: "depends_on", strength: 0.95 },
        { source: "contextX", target: "tool2", relationship: "influences", strength: 0.7 },
        { source: "tool1", target: "tool2", relationship: "indirectly_uses", strength: 0.5 },
      ],
    };
    const result = contextAnalyzer.analyze(payload);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(3);
  });
});