import { describe, it, expect } from "vitest";
import { DependencyGraphMerger } from "../src/dependency/dependency-graph-merger.js";
import { DependencyGraph } from "../src/dependency/dependency-graph.js";

describe("DependencyGraphMerger", () => {
  it("should merge multiple graphs correctly when nodes and edges are unique", () => {
    const graph1 = new DependencyGraph();
    graph1.addNode("A", { name: "A" });
    graph1.addNode("B", { name: "B" });
    graph1.addEdge("A", "B", 1.0);

    const graph2 = new DependencyGraph();
    graph2.addNode("C", { name: "C" });
    graph2.addNode("D", { name: "D" });
    graph2.addEdge("C", "D", 0.5);

    const merger = new DependencyGraphMerger([graph1, graph2]);
    const mergedGraph = merger.merge();

    expect(mergedGraph.getNodes()).toHaveSize(4);
    expect(mergedGraph.getEdges("A")).toHaveLength(1);
    expect(mergedGraph.getEdges("C")).toHaveLength(1);
  });

  it("should merge nodes and edges correctly when nodes overlap", () => {
    const graph1 = new DependencyGraph();
    graph1.addNode("A", { name: "A", version: "1.0" });
    graph1.addEdge("A", "B", 1.0);

    const graph2 = new DependencyGraph();
    graph2.addNode("A", { name: "A", version: "2.0" });
    graph2.addEdge("A", "C", 0.5);

    const merger = new DependencyGraphMerger([graph1, graph2]);
    const mergedGraph = merger.merge();

    expect(mergedGraph.getNodes()).toHaveSize(2); // A and B, C
    expect(mergedGraph.getNodeData("A")).toEqual(expect.objectContaining({ version: "2.0" })); // Should take the last one or merge data
    expect(mergedGraph.getEdges("A")).toHaveLength(2);
  });

  it("should handle merging with empty graphs", () => {
    const graph1 = new DependencyGraph();
    const graph2 = new DependencyGraph();

    const merger = new DependencyGraphMerger([graph1, graph2]);
    const mergedGraph = merger.merge();

    expect(mergedGraph.getNodes()).toHaveSize(0);
    expect(mergedGraph.getEdges()).toEqual({});
  });
});