import { describe, it, expect } from "vitest";
import { ToolCapabilityDependencyGraphBuilder } from "../src/capability/tool-capability-dependency-graph-builder";

describe("ToolCapabilityDependencyGraphBuilder", () => {
  it("should build a correct dependency graph from a set of tools", () => {
    const builder = new ToolCapabilityDependencyGraphBuilder();
    const tools = [
      {
        id: "toolA",
        name: "Tool A",
        description: "A tool that outputs data for toolB",
        inputs: [{ name: "input1", type: "string" }],
        outputs: [{ name: "outputA", type: "string" }],
      },
      {
        id: "toolB",
        name: "Tool B",
        description: "A tool that requires output from toolA",
        inputs: [{ name: "inputB", type: "string" }],
        outputs: [{ name: "outputB", type: "string" }],
        dependencies: [
          {
            fromToolId: "toolA",
            fromOutputName: "outputA",
            toToolId: "toolB",
            toInputName: "inputB",
            dependencyType: "output_required",
            reason: "Tool B needs outputA for inputB",
          },
        ],
      },
    ];
    const graph = builder.buildGraph(tools);

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].from).toBe("toolA");
    expect(graph.edges[0].to).toBe("toolB");
    expect(graph.edges[0].dependencyType).toBe("output_required");
  });

  it("should handle tools with no explicit dependencies", () => {
    const builder = new ToolCapabilityDependencyGraphBuilder();
    const tools = [
      {
        id: "toolC",
        name: "Tool C",
        description: "A standalone tool",
        inputs: [{ name: "inputC", type: "number" }],
        outputs: [{ name: "outputC", type: "number" }],
        dependencies: [],
      },
      {
        id: "toolD",
        name: "Tool D",
        description: "Another standalone tool",
        inputs: [],
        outputs: [],
        dependencies: [],
      },
    ];
    const graph = builder.buildGraph(tools);

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(0);
  });

  it("should correctly identify structural dependencies when multiple outputs map to one input", () => {
    const builder = new ToolCapabilityDependencyGraphBuilder();
    const tools = [
      {
        id: "toolX",
        name: "Tool X",
        description: "Outputs data used by toolY and toolZ",
        outputs: [{ name: "sharedOutput", type: "string" }],
      },
      {
        id: "toolY",
        name: "Tool Y",
        description: "Uses shared output",
        inputs: [{ name: "inputY", type: "string" }],
        dependencies: [
          {
            fromToolId: "toolX",
            fromOutputName: "sharedOutput",
            toToolId: "toolY",
            toInputName: "inputY",
            dependencyType: "output_required",
            reason: "Tool Y needs sharedOutput",
          },
        ],
      },
      {
        id: "toolZ",
        name: "Tool Z",
        description: "Also uses shared output",
        inputs: [{ name: "inputZ", type: "string" }],
        dependencies: [
          {
            fromToolId: "toolX",
            fromOutputName: "sharedOutput",
            toToolId: "toolZ",
            toInputName: "inputZ",
            dependencyType: "output_required",
            reason: "Tool Z needs sharedOutput",
          },
        ],
      },
    ];
    const graph = builder.buildGraph(tools);

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.edges.every(edge => edge.dependencyType === "output_required")).toBe(true);
  });
});