import { describe, it, expect } from "vitest";
import { DynamicCapabilityGraphBuilder } from "../src/capability/dynamic-capability-graph-builder";
import { ToolDefinition } from "../src/capability/tool-definition";

describe("DynamicCapabilityGraphBuilder", () => {
  it("should build a graph with correct nodes and edges from provided data", () => {
    const toolA: ToolDefinition = { name: "toolA", description: "A tool", capabilities: ["cap1", "cap2"] };
    const toolB: ToolDefinition = { name: "toolB", description: "A tool", capabilities: ["cap2", "cap3"] };
    const toolC: ToolDefinition = { name: "toolC", description: "A tool", capabilities: ["cap1"] };

    const toolDefinitions = [toolA, toolB, toolC];
    const toolCapabilities = new Map<string, Set<string>>();
    toolCapabilities.set("toolA", new Set(["cap1", "cap2"]));
    toolCapabilities.set("toolB", new Set(["cap2", "cap3"]));
    toolCapabilities.set("toolC", new Set(["cap1"]));

    const builder = new DynamicCapabilityGraphBuilder(toolDefinitions, toolCapabilities);
    const graph = builder.buildGraph();

    expect(graph.size).toBe(3); // toolA, toolB, toolC
    expect(graph.get("toolA")!.nodes).toContain("toolA");
    expect(graph.get("toolA")!.edges.get("toolB")).toContain("cap2");
    expect(graph.get("toolA")!.edges.get("toolC")).toContain("cap1");
  });

  it("should handle cases with no overlapping capabilities", () => {
    const toolA: ToolDefinition = { name: "toolA", description: "A tool", capabilities: ["cap1"] };
    const toolB: ToolDefinition = { name: "toolB", description: "A tool", capabilities: ["cap2"] };

    const toolDefinitions = [toolA, toolB];
    const toolCapabilities = new Map<string, Set<string>>();
    toolCapabilities.set("toolA", new Set(["cap1"]));
    toolCapabilities.set("toolB", new Set(["cap2"]));

    const builder = new DynamicCapabilityGraphBuilder(toolDefinitions, toolCapabilities);
    const graph = builder.buildGraph();

    expect(graph.size).toBe(2);
    // Check that edges map is empty or only contains self-references if implemented, but for this test, we check for no cross-edges
    expect(graph.get("toolA")!.edges.get("toolB")).toBeUndefined();
    expect(graph.get("toolB")!.edges.get("toolA")).toBeUndefined();
  });

  it("should correctly build a graph when only one tool is present", () => {
    const toolA: ToolDefinition = { name: "toolA", description: "A tool", capabilities: ["cap1", "cap2"] };
    const toolDefinitions = [toolA];
    const toolCapabilities = new Map<string, Set<string>>();
    toolCapabilities.set("toolA", new Set(["cap1", "cap2"]));

    const builder = new DynamicCapabilityGraphBuilder(toolDefinitions, toolCapabilities);
    const graph = builder.buildGraph();

    expect(graph.size).toBe(1);
    expect(graph.get("toolA")!.nodes).toContain("toolA");
    expect(graph.get("toolA")!.edges.size).toBe(1); // Should only have an edge to itself if the logic includes it, or 0 if it only checks other tools. Assuming it checks all tools.
  });
});