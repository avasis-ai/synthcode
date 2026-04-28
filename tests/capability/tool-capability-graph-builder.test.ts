import { describe, it, expect } from "vitest";
import { ToolCapabilityGraphBuilder } from "../src/capability/tool-capability-graph-builder";
import { ToolDefinition, Capability } from "../src/capability/types";

describe("ToolCapabilityGraphBuilder", () => {
  it("should initialize with empty graph structures", () => {
    const builder = new ToolCapabilityGraphBuilder();
    expect(builder.getGraph().tools.size).toBe(0);
    expect(builder.getGraph().capabilityEdges.length).toBe(0);
  });

  it("should correctly add tools and build capability edges", () => {
    const builder = new ToolCapabilityGraphBuilder();
    const toolA: ToolDefinition = { id: "toolA", name: "Tool A", description: "Desc A", capabilities: ["cap1"] };
    const toolB: ToolDefinition = { id: "toolB", name: "Tool B", description: "Desc B", capabilities: ["cap2"] };
    const edge: { sourceToolId: string; requiredCapability: Capability; providingCapability: Capability } = {
      sourceToolId: "toolA",
      requiredCapability: "cap2",
      providingCapability: "cap1",
    };

    builder.addTool(toolA);
    builder.addTool(toolB);
    builder.addCapabilityEdge(edge);

    const graph = builder.getGraph();
    expect(graph.tools.size).toBe(2);
    expect(graph.capabilityEdges.length).toBe(1);
    expect(graph.capabilityEdges[0]).toEqual(edge);
  });

  it("should update the graph when adding multiple tools and edges", () => {
    const builder = new ToolCapabilityGraphBuilder();
    const tool1: ToolDefinition = { id: "t1", name: "T1", description: "D1", capabilities: ["c1"] };
    const tool2: ToolDefinition = { id: "t2", name: "T2", description: "D2", capabilities: ["c2"] };
    const edge1: { sourceToolId: string; requiredCapability: Capability; providingCapability: Capability } = {
      sourceToolId: "t1",
      requiredCapability: "c2",
      providingCapability: "c1",
    };
    const edge2: { sourceToolId: string; requiredCapability: Capability; providingCapability: Capability } = {
      sourceToolId: "t2",
      requiredCapability: "c1",
      providingCapability: "c2",
    };

    builder.addTool(tool1);
    builder.addTool(tool2);
    builder.addCapabilityEdge(edge1);
    builder.addCapabilityEdge(edge2);

    const graph = builder.getGraph();
    expect(graph.tools.size).toBe(2);
    expect(graph.capabilityEdges.length).toBe(2);
  });
});