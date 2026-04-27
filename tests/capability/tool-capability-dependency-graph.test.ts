import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/capability/tool-capability-dependency-graph";

describe("DependencyGraph", () => {
  it("should initialize correctly with an empty graph", () => {
    const graph = new DependencyGraph();
    expect(graph.getGraphSize()).toBe(0);
  });

  it("should add a capability and update the graph size", () => {
    const graph = new DependencyGraph();
    const metadata: any = {
      name: "toolA",
      description: "A tool",
      prerequisites: [],
      conflicts_with: [],
      requires_inputs: {},
      output_effects: [],
    };
    graph.addCapability("toolA", metadata);
    expect(graph.getGraphSize()).toBe(1);
  });

  it("should correctly identify dependencies when adding a capability", () => {
    const graph = new DependencyGraph();
    const metadataA: any = {
      name: "toolA",
      description: "Tool A",
      prerequisites: [],
      conflicts_with: [],
      requires_inputs: {},
      output_effects: [],
    };
    const metadataB: any = {
      name: "toolB",
      description: "Tool B",
      prerequisites: ["toolA"],
      conflicts_with: [],
      requires_inputs: {},
      output_effects: [],
    };
    graph.addCapability("toolA", metadataA);
    graph.addCapability("toolB", metadataB);

    const toolBData = graph.getCapability("toolB");
    expect(toolBData).toBeDefined();
    expect(toolBData?.dependencies.requires).toContain("toolA");
  });
});