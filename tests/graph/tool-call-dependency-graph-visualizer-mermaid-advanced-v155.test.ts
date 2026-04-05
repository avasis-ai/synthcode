import { describe, it, expect } from "vitest";
import {
  DependencyGraphNode,
  DependencyGraphEdge,
  DependencyGraph,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v155";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph = new DependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new DependencyGraph();
    const node1: DependencyGraphNode = { id: "start", label: "Start" };
    const node2: DependencyGraphNode = { id: "user", label: "User Input" };
    const edge1: DependencyGraphEdge = { from: "start", to: "user", label: "Initiate" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge(edge1);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes).toContainEqual(node1);
    expect(graph.edges).toContainEqual(edge1);
  });

  it("should generate a basic mermaid diagram string", () => {
    const graph = new DependencyGraph();
    const node1: DependencyGraphNode = { id: "start", label: "Start" };
    const node2: DependencyGraphNode = { id: "user", label: "User Input" };
    const edge1: DependencyGraphEdge = { from: "start", to: "user", label: "Initiate" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addEdge(edge1);

    const mermaidDiagram = graph.toMermaid();
    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("Start[Start]");
    expect(mermaidDiagram).toContain("UserInput[User Input]");
    expect(mermaidDiagram).toContain("Start --> UserInput");
  });
});