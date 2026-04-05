import { describe, it, expect } from "vitest";
import { renderMermaidSimpleGraph, GraphStructure } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-simple";

describe("renderMermaidSimpleGraph", () => {
  it("should generate a basic graph structure for two connected nodes", () => {
    const structure: GraphStructure = {
      nodes: [
        { id: "A", name: "Node A", description: "Desc A" },
        { id: "B", name: "Node B", description: "Desc B" },
      ],
      edges: [
        { fromNodeId: "A", toNodeId: "B", label: "calls" },
      ],
    };
    const expected = `graph TD
A["Node A<br>Desc A"]
B["Node B<br>Desc B"]
A -->|calls| B`;
    expect(renderMermaidSimpleGraph(structure)).toBe(expected);
  });

  it("should handle multiple nodes and edges correctly", () => {
    const structure: GraphStructure = {
      nodes: [
        { id: "Start", name: "Start", description: "Start node" },
        { id: "Process", name: "Process", description: "Processing step" },
        { id: "End", name: "End", description: "Final step" },
      ],
      edges: [
        { fromNodeId: "Start", toNodeId: "Process", label: "leads to" },
        { fromNodeId: "Process", toNodeId: "End", label: "completes" },
      ],
    };
    const expected = `graph TD
Start["Start<br>Start node"]
Process["Process<br>Processing step"]
End["End<br>Final step"]
Start -->|leads to| Process
Process -->|completes| End`;
    expect(renderMermaidSimpleGraph(structure)).toBe(expected);
  });

  it("should return only the graph definition if no nodes or edges are present", () => {
    const structure: GraphStructure = {
      nodes: [],
      edges: [],
    };
    const expected = "graph TD\n";
    expect(renderMermaidSimpleGraph(structure)).toBe(expected);
  });
});