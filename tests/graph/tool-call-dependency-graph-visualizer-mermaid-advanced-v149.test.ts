import { describe, it, expect } from "vitest";
import {
  AdvancedGraphOptions,
  GraphNode,
  GraphEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v149";

describe("AdvancedGraphOptions", () => {
  it("should correctly structure basic graph options", () => {
    const options: AdvancedGraphOptions = {
      customCssClasses: {
        root: "mermaid-root",
      },
      subgraphDefinitions: [
        {
          id: "subgraph1",
          title: "Tool Calls",
          nodes: ["toolA", "toolB"],
          edges: ["toolA_to_toolB"],
        },
      ],
    };
    expect(options).toBeDefined();
    expect(options?.customCssClasses?.root).toBe("mermaid-root");
    expect(options?.subgraphDefinitions).toHaveLength(1);
    expect(options?.subgraphDefinitions![0].title).toBe("Tool Calls");
  });

  it("should handle empty subgraph definitions", () => {
    const options: AdvancedGraphOptions = {
      subgraphDefinitions: [],
    };
    expect(options).toBeDefined();
    expect(options?.subgraphDefinitions).toEqual([]);
  });

  it("should allow for missing optional properties", () => {
    const options: AdvancedGraphOptions = {};
    expect(options).toBeDefined();
    expect(options?.customCssClasses).toBeUndefined();
    expect(options?.subgraphDefinitions).toBeUndefined();
  });
});