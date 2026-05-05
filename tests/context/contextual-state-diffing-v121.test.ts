import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v121";

describe("ContextualStateDiffer", () => {
  it("should correctly identify added edges when the state graph grows", () => {
    const initialState: any = { nodes: ["A", "B"], edges: [["A", "B"]] };
    const newState: any = { nodes: ["A", "B", "C"], edges: [["A", "B"], ["B", "C"]] };

    const stateGraphBuilder = (state: any) => {
      const graph = new Map<string, Set<string>>();
      if (state.nodes) {
        state.nodes.forEach(node => {
          graph.set(node, new Set());
        });
      }
      if (state.edges) {
        state.edges.forEach(([source, target]) => {
          graph.get(source)?.add(target);
        });
      }
      return graph;
    };

    const differ = new ContextualStateDiffer(stateGraphBuilder);
    const diff = differ.calculateDiff(initialState, newState);

    expect(diff.addedEdges).toEqual(new Set([["B", "C"]]));
    expect(diff.removedEdges).toEqual(new Set());
    expect(diff.modifiedEdges).toEqual(new Set());
  });

  it("should correctly identify removed edges when the state graph shrinks", () => {
    const initialState: any = { nodes: ["A", "B", "C"], edges: [["A", "B"], ["B", "C"]] };
    const newState: any = { nodes: ["A", "B"], edges: [["A", "B"]] };

    const stateGraphBuilder = (state: any) => {
      const graph = new Map<string, Set<string>>();
      if (state.nodes) {
        state.nodes.forEach(node => {
          graph.set(node, new Set());
        });
      }
      if (state.edges) {
        state.edges.forEach(([source, target]) => {
          graph.get(source)?.add(target);
        });
      }
      return graph;
    };

    const differ = new ContextualStateDiffer(stateGraphBuilder);
    const diff = differ.calculateDiff(initialState, newState);

    expect(diff.addedEdges).toEqual(new Set());
    expect(diff.removedEdges).toEqual(new Set([["B", "C"]]));
    expect(diff.modifiedEdges).toEqual(new Set());
  });

  it("should identify modified edges when an edge changes target", () => {
    const initialState: any = { nodes: ["A", "B"], edges: [["A", "B"]] };
    const newState: any = { nodes: ["A", "B"], edges: [["A", "C"]] };

    const stateGraphBuilder = (state: any) => {
      const graph = new Map<string, Set<string>>();
      if (state.nodes) {
        state.nodes.forEach(node => {
          graph.set(node, new Set());
        });
      }
      if (state.edges) {
        state.edges.forEach(([source, target]) => {
          graph.get(source)?.add(target);
        });
      }
      return graph;
    };

    const differ = new ContextualStateDiffer(stateGraphBuilder);
    const diff = differ.calculateDiff(initialState, newState);

    expect(diff.addedEdges).toEqual(new Set());
    expect(diff.removedEdges).toEqual(new Set([["A", "B"]]));
    expect(diff.modifiedEdges).toEqual(new Set([["A", "B"]])); // In this simplified model, we treat removal and addition as the change for the edge key
  });
});