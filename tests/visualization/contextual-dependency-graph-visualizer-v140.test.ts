import { describe, it, expect } from "vitest";
import { DependencyGraph, createContextualDependencyGraph } from "../src/visualization/contextual-dependency-graph-visualizer-v140";

describe("createContextualDependencyGraph", () => {
  it("should create an empty graph when provided with no messages", () => {
    const graph = createContextualDependencyGraph([]);
    expect(graph.nodes).toEqual({});
    expect(graph.edges).toEqual([]);
  });

  it("should create nodes and edges for a simple sequence of messages", () => {
    const messages = [
      { type: "user", content: "Hello", id: "user1" },
      { type: "assistant", content: "Hi there!", id: "assistant1" },
    ];
    const graph = createContextualDependencyGraph(messages);
    expect(Object.keys(graph.nodes).length).toBe(2);
    expect(graph.nodes["user1"]).toBeDefined();
    expect(graph.edges.length).toBe(1);
  });

  it("should calculate dependency edges based on content overlap and temporal proximity", () => {
    const messages = [
      { type: "user", content: "What is the capital of France?", id: "user1" },
      { type: "assistant", content: "The capital of France is Paris.", id: "assistant1" },
    ];
    const graph = createContextualDependencyGraph(messages);
    const edge = graph.edges.find(e => e.sourceId === "user1" && e.targetId === "assistant1");
    expect(edge).toBeDefined();
    expect(edge!.temporalProximityScore).toBeGreaterThan(0);
    expect(edge!.resourceOverlapScore).toBeGreaterThan(0);
  });
});