import { describe, it, expect } from "vitest";
import { GraphDiffingService } from "../src/schema/semantic-context-graph-diffing-v130";

describe("GraphDiffingService", () => {
  it("should correctly calculate diff when nodes are added", () => {
    const initialGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.0, metadata: {} },
      },
    };
    const updatedGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
        "n3": { id: "n3", data: { type: "assistant" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.0, metadata: {} },
        "e2": { source: "n1", target: "n3", weight: 0.5, metadata: {} },
      },
    };

    const diff = GraphDiffingService.diff(initialGraph, updatedGraph);

    expect(diff.nodes.added).toHaveLength(1);
    expect(diff.nodes.added).toContainEqual({ id: "n3", data: { type: "assistant" } });
    expect(diff.edges.added).toHaveLength(1);
    expect(diff.edges.added).toContainEqual({ source: "n1", target: "n3", weight: 0.5, metadata: {} });
  });

  it("should correctly calculate diff when nodes are removed", () => {
    const initialGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
        "n2": { id: "n2", data: { type: "tool_result" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.0, metadata: {} },
      },
    };
    const updatedGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.0, metadata: {} },
      },
    };

    const diff = GraphDiffingService.diff(initialGraph, updatedGraph);

    expect(diff.nodes.removed).toHaveLength(1);
    expect(diff.nodes.removed).toContainEqual({ id: "n2", data: { type: "tool_result" } });
    expect(diff.edges.removed).toHaveLength(0); // Assuming edge removal requires explicit handling or is not tracked if endpoints remain
  });

  it("should correctly calculate diff when an edge weight is modified", () => {
    const initialGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
        "n2": { id: "n2", data: { type: "tool_result" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.0, metadata: {} },
      },
    };
    const updatedGraph: any = {
      nodes: {
        "n1": { id: "n1", data: { type: "user" } },
        "n2": { id: "n2", data: { type: "tool_result" } },
      },
      edges: {
        "e1": { source: "n1", target: "n2", weight: 1.5, metadata: {} }, // Modified weight
      },
    };

    const diff = GraphDiffingService.diff(initialGraph, updatedGraph);

    expect(diff.edges.modified).toHaveLength(1);
    expect(diff.edges.modified).toContainEqual({
      source: "n1",
      target: "n2",
      weight: 1.5,
      metadata: {},
    });
  });
});