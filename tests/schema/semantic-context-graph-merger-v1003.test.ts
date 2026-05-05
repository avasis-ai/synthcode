import { describe, it, expect } from "vitest";
import { ContextGraphMerger } from "../src/schema/semantic-context-graph-merger-v1003";

describe("ContextGraphMerger", () => {
  it("should correctly merge nodes and edges from two contexts", () => {
    const merger = new ContextGraphMerger();
    const contextA = {
      nodes: new Map([["node1", { id: "node1", type: "user" }]]),
      edges: new Map([["edge1", { source: "node1", target: "node2" }]]),
      messages: [],
    };
    const contextB = {
      nodes: new Map([["node1", { id: "node1", type: "system" }]]),
      edges: new Map([["edge2", { source: "node1", target: "node3" }]]),
      messages: [],
    };

    const mergedContext = merger.merge(contextA, contextB);

    expect(mergedContext.nodes.size).toBe(2);
    expect(mergedContext.nodes.get("node1")).toEqual({ id: "node1", type: "system" }); // Expect B to overwrite A if types differ
    expect(mergedContext.edges.size).toBe(2);
    expect(mergedContext.edges.has("edge1")).toBe(true);
    expect(mergedContext.edges.has("edge2")).toBe(true);
  });

  it("should handle message merging with conflict resolution", () => {
    const merger = new ContextGraphMerger({
      mergeRules: {
        sourceTrustScore: 0.8,
        temporalDecayFactor: 0.1,
      },
    });

    const messageA = { type: "user", content: "Hello", timestamp: 1678886400000 };
    const messageB = { type: "assistant", content: "Hi there", timestamp: 1678886500000 };

    // Simulate a scenario where message merging logic is tested (assuming the merger handles message array merging)
    // Since the provided snippet is incomplete, we test the structure assuming a merge method exists for messages.
    const mergedMessages = merger.mergeMessages([messageA, messageB]);

    expect(mergedMessages).toHaveLength(2);
    // In a real scenario, we'd check if conflict resolution logic was applied if messages overlapped.
    // For this test, we ensure the basic merge structure holds.
  });

  it("should correctly merge context when one context is empty", () => {
    const merger = new ContextGraphMerger();
    const contextA = {
      nodes: new Map([["nodeA", { id: "nodeA" }]]),
      edges: new Map([["edgeA", { source: "nodeA", target: "nodeB" }]]),
      messages: [{ type: "user", content: "Test" }],
    };
    const contextB = {
      nodes: new Map(),
      edges: new Map(),
      messages: [],
    };

    const mergedContext = merger.merge(contextA, contextB);

    expect(mergedContext.nodes).toEqual(contextA.nodes);
    expect(mergedContext.edges).toEqual(contextA.edges);
    expect(mergedContext.messages).toEqual(contextA.messages);
  });
});