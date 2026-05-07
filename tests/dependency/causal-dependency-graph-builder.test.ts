import { describe, it, expect } from "vitest";
import { CausalDependencyGraphBuilder, CausalLink } from "../../../src/dependency/causal-dependency-graph-builder";

describe("CausalDependencyGraphBuilder", () => {
  it("should correctly build a graph from a list of nodes and links", () => {
    const nodes = ["A", "B", "C"];
    const links: CausalLink[] = [
      { sourceId: "A", targetId: "B", causality: "REQUIRES" },
      { sourceId: "B", targetId: "C", causality: "CAUSES" },
    ];

    const builder = new CausalDependencyGraphBuilder(nodes, links);
    const graph = builder.build();

    expect(graph.nodes.get("A")!.dependencies).toEqual(new Set(["B"]));
    expect(graph.nodes.get("B")!.dependencies).toEqual(new Set(["C"]));
    expect(graph.nodes.get("C")!.dependencies).toEqual(new Set());
    expect(graph.nodes.get("A")!.dependents).toEqual(new Set());
    expect(graph.nodes.get("B")!.dependents).toEqual(new Set(["A"]));
    expect(graph.nodes.get("C")!.dependents).toEqual(new Set(["B"]));
  });

  it("should handle multiple links between the same pair of nodes", () => {
    const nodes = ["X", "Y"];
    const links: CausalLink[] = [
      { sourceId: "X", targetId: "Y", causality: "REQUIRES" },
      { sourceId: "X", targetId: "Y", causality: "CAUSES" },
    ];

    const builder = new CausalDependencyGraphBuilder(nodes, links);
    const graph = builder.build();

    // Check that the sets only contain unique IDs, regardless of link count/type
    expect(graph.nodes.get("X")!.dependents).toEqual(new Set(["Y"]));
    expect(graph.nodes.get("Y")!.dependencies).toEqual(new Set(["X"]));
  });

  it("should handle empty input gracefully", () => {
    const nodes: string[] = [];
    const links: CausalLink[] = [];

    const builder = new CausalDependencyGraphBuilder(nodes, links);
    const graph = builder.build();

    expect(graph.nodes.size).toBe(0);
    expect(graph.links.length).toBe(0);
  });
});