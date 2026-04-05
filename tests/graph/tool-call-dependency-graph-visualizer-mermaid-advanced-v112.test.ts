import { describe, it, expect } from "vitest";
import { GraphConfig } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v112";

describe("GraphConfig", () => {
  it("should correctly structure a basic graph configuration", () => {
    const config: GraphConfig = {
      graphType: "graph TD",
      nodes: {
        A: { label: "Start Node" },
        B: { label: "End Node" },
      },
      edges: [
        { from: "A", to: "B", label: "Connects" },
      ],
    };
    expect(config.graphType).toBe("graph TD");
    expect(config.nodes).toHaveProperty("A");
    expect(config.edges).toHaveLength(1);
  });

  it("should handle advanced styling and layout options", () => {
    const config: GraphConfig = {
      graphType: "graph LR",
      nodes: {
        Start: { label: "Start", style: { backgroundColor: "#f9f" }, class: "input" },
        Process: { label: "Process", style: { color: "blue" } },
      },
      edges: [
        { from: "Start", to: "Process", label: "Flow", style: { strokeWidth: "2px" } },
      ],
      layoutOptions: {
        rankDir: "TB",
        subgraphG: "subgraphGroup",
      },
    };
    expect(config.graphType).toBe("graph LR");
    expect(config.nodes.Start).toEqual({
      label: "Start",
      style: { backgroundColor: "#f9f" },
      class: "input",
    });
    expect(config.edges[0].label).toBe("Flow");
    expect(config.layoutOptions).toEqual({
      rankDir: "TB",
      subgraphG: "subgraphGroup",
    });
  });

  it("should be valid with minimal required fields", () => {
    const config: GraphConfig = {
      graphType: "graph TD",
      nodes: {
        N1: { label: "Node 1" },
        N2: { label: "Node 2" },
      },
      edges: [
        { from: "N1", to: "N2" },
      ],
    };
    expect(config.graphType).toBe("graph TD");
    expect(config.nodes).toHaveProperty("N1");
    expect(config.edges).toHaveLength(1);
  });
});