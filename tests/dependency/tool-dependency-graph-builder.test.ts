import { describe, it, expect } from "vitest";
import { ToolDependencyBuilder, DependencyGraph } from "../src/dependency/tool-dependency-graph-builder";

describe("ToolDependencyBuilder", () => {
  it("should initialize with empty graph", () => {
    const builder = new ToolDependencyBuilder();
    const graph = builder.buildGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
    expect(graph.isValid).toBe(true);
  });

  it("should add a dependency between two tools with a BEFORE constraint", () => {
    const builder = new ToolDependencyBuilder();
    builder.addDependency("toolA", "toolB", "BEFORE");
    const graph = builder.buildGraph();
    expect(graph.nodes.has("toolA")).toBe(true);
    expect(graph.nodes.has("toolB")).toBe(true);
    expect(graph.edges.get("toolA")).toBeDefined();
    expect(graph.edges.get("toolA")!.has({ target: "toolB", constraint: "BEFORE" })).toBe(true);
    expect(graph.edges.get("toolB")).toBeUndefined();
  });

  it("should handle multiple dependencies and resources correctly", () => {
    const builder = new ToolDependencyBuilder();
    builder.addDependency("toolX", "toolY", "AFTER", "resource1");
    builder.addDependency("toolX", "toolZ", "REQUIRES_RESOURCE", "resource2");
    const graph = builder.buildGraph();
    expect(graph.nodes.has("toolX")).toBe(true);
    expect(graph.nodes.has("toolY")).toBe(true);
    expect(graph.nodes.has("toolZ")).toBe(true);
    expect(graph.edges.get("toolX")!.has({ target: "toolY", constraint: "AFTER", resource: "resource1" })).toBe(true);
    expect(graph.edges.get("toolX")!.has({ target: "toolZ", constraint: "REQUIRES_RESOURCE", resource: "resource2" })).toBe(true);
  });
});