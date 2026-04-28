import { describe, it, expect } from "vitest";
import {
  GraphVisualization,
  ToolDefinition,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v141";

describe("dynamicToolDependencyGraphVisualizerV141", () => {
  it("should correctly generate graph visualization for a simple dependency", () => {
    const tools: ToolDefinition[] = [
      {
        name: "toolA",
        description: "Tool A description",
        inputSchema: {},
        outputSchema: {},
        dependencies: [],
      },
      {
        name: "toolB",
        description: "Tool B description",
        inputSchema: {},
        outputSchema: {},
        dependencies: ["toolA"],
      },
    ];

    const visualization = GraphVisualization.generate(tools);

    expect(visualization.nodes).toHaveLength(2);
    expect(visualization.edges).toHaveLength(1);
    expect(visualization.edges[0].source).toBe("toolA");
    expect(visualization.edges[0].target).toBe("toolB");
  });

  it("should handle multiple dependencies between tools", () => {
    const tools: ToolDefinition[] = [
      {
        name: "toolX",
        description: "Tool X",
        inputSchema: {},
        outputSchema: {},
        dependencies: [],
      },
      {
        name: "toolY",
        description: "Tool Y",
        inputSchema: {},
        outputSchema: {},
        dependencies: ["toolX"],
      },
      {
        name: "toolZ",
        description: "Tool Z",
        inputSchema: {},
        outputSchema: {},
        dependencies: ["toolX", "toolY"],
      },
    ];

    const visualization = GraphVisualization.generate(tools);

    expect(visualization.nodes).toHaveLength(3);
    // Expecting at least 2 edges: X->Y and X->Z, Y->Z
    expect(visualization.edges).toHaveLength(2);
    const edgeSources = visualization.edges.map(e => e.source);
    const edgeTargets = visualization.edges.map(e => e.target);

    expect(edgeSources).toContain("toolX");
    expect(edgeTargets).toContain("toolY");
    expect(edgeSources).toContain("toolY");
    expect(edgeTargets).toContain("toolZ");
  });

  it("should return empty graph visualization for no tools", () => {
    const tools: ToolDefinition[] = [];

    const visualization = GraphVisualization.generate(tools);

    expect(visualization.nodes).toHaveLength(0);
    expect(visualization.edges).toHaveLength(0);
  });
});