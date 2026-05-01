import { describe, it, expect } from "vitest";
import { ContextualConstraintPropagationGraph } from "../src/context/contextual-constraint-propagation-graph";

describe("ContextualConstraintPropagationGraph", () => {
  it("should initialize correctly with an empty graph", () => {
    const graph = new ContextualConstraintPropagationGraph();
    expect(graph.getNodes().length).toBe(0);
    expect(graph.getEdges().length).toBe(0);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new ContextualConstraintPropagationGraph();
    const node1 = { id: "n1", constraint: { type: "temporal", source: "A", description: "Time A", severity: "low", appliesTo: "T1" } };
    const node2 = { id: "n2", constraint: { type: "resource", source: "B", description: "Resource B", severity: "medium", appliesTo: "T2" } };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge("n1", "n2", (c1, c2) => "Rule A->B");

    expect(graph.getNodes().length).toBe(2);
    expect(graph.getEdges().length).toBe(1);
    expect(graph.getEdge("n1", "n2")).toBe("Rule A->B");
  });

  it("should correctly propagate constraints when an edge is added", () => {
    const graph = new ContextualConstraintPropagationGraph();
    const node1 = { id: "n1", constraint: { type: "capability", source: "User", description: "Can use X", severity: "high", appliesTo: "C1" } };
    const node2 = { id: "n2", constraint: { type: "logical", source: "System", description: "Must be true", severity: "medium", appliesTo: "L2" } };

    graph.addNode(node1);
    graph.addNode(node2);
    const rule = (c1: any, c2: any) => `Propagates ${c1.type} to ${c2.type}`;
    graph.addEdge("n1", "n2", rule);

    const edge = graph.getEdge("n1", "n2");
    expect(edge).toBeDefined();
    // Check if the propagation rule is callable and returns the expected structure/value
    const ruleFunction = (edge as any).propagationRule;
    expect(typeof ruleFunction).toBe('function');
    const result = ruleFunction(node1.constraint, node2.constraint);
    expect(result).toBe("Propagates capability to logical");
  });
});