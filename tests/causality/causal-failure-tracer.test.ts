import { describe, it, expect } from "vitest";
import { ContextualDependencyGraph } from "../src/causality/causal-failure-tracer.js";

describe("ContextualDependencyGraph", () => {
  it("should initialize with an empty map", () => {
    const graph = new ContextualDependencyGraph();
    expect(graph.nodes).toBeInstanceOf(Map);
    expect(graph.nodes.size).toBe(0);
  });

  it("should add a node correctly", () => {
    const graph = new ContextualDependencyGraph();
    const nodeId = "node1";
    const node = {
      id: nodeId,
      description: "Test Node",
      associatedEvent: null,
      constraints: ["C1"],
      failurePotential: 0.5,
    };
    graph.addNode(node);

    expect(graph.nodes.has(nodeId)).toBe(true);
    expect(graph.nodes.get(nodeId)).toEqual(node);
  });

  it("should correctly update a node's failure potential", () => {
    const graph = new ContextualDependencyGraph();
    const nodeId = "node2";
    const initialNode = {
      id: nodeId,
      description: "Initial",
      associatedEvent: null,
      constraints: [],
      failurePotential: 0.1,
    };
    graph.addNode(initialNode);

    const updatedNode = {
      id: nodeId,
      description: "Updated",
      associatedEvent: null,
      constraints: [],
      failurePotential: 0.8,
    };
    graph.updateNodeFailurePotential(nodeId, 0.8);

    expect(graph.nodes.get(nodeId)?.failurePotential).toBe(0.8);
  });
});