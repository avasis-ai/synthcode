import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v135";

describe("ToolCallDependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new ToolCallDependencyGraph();
    const node1 = { id: "A", description: "Start", onTrue: "B", onFalse: "C" };
    const node2 = { id: "B", description: "True Path", onTrue: "", onFalse: "" };
    const node3 = { id: "C", description: "False Path", onTrue: "", onFalse: "" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addNode(node3);

    graph.addEdge({ fromNodeId: "A", toNodeId: "B", condition: "True", label: "Success" });
    graph.addEdge({ fromNodeId: "A", toNodeId: "C", condition: "False", label: "Failure" });

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.nodes.some(n => n.id === "A")).toBe(true);
    expect(graph.edges.some(e => e.fromNodeId === "A" && e.toNodeId === "B")).toBe(true);
  });

  it("should generate a valid Mermaid diagram string", () => {
    const graph = new ToolCallDependencyGraph();
    const node1 = { id: "Start", description: "Start", onTrue: "Success", onFalse: "Failure" };
    const node2 = { id: "Success", description: "Success", onTrue: "", onFalse: "" };
    const node3 = { id: "Failure", description: "Failure", onTrue: "", onFalse: "" };

    graph.addNode(node1);
    graph.addNode(node2);
    graph.addNode(node3);

    graph.addEdge({ fromNodeId: "Start", toNodeId: "Success", condition: "True", label: "Success" });
    graph.addEdge({ fromNodeId: "Start", toNodeId: "Failure", condition: "False", label: "Failure" });

    const mermaidDiagram = graph.toMermaid();
    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("Start -->|Success| Success");
    expect(mermaidDiagram).toContain("Start -->|Failure| Failure");
  });
});