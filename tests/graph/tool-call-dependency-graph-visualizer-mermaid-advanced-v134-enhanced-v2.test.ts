import { describe, it, expect } from "vitest";
import { AdvancedGraphOptions } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v2";
import { buildMermaidGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v2";

describe("buildMermaidGraph", () => {
  it("should generate a basic graph structure with default options", () => {
    const options: AdvancedGraphOptions = {
      graphTitle: "Test Graph",
      startNodeId: "A",
      endNodeId: "C",
    };
    const graph = buildMermaidGraph(options);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A --> B");
    expect(graph).toContain("B --> C");
  });

  it("should include conditional paths when provided", () => {
    const options: AdvancedGraphOptions = {
      graphTitle: "Conditional Test",
      startNodeId: "Start",
      endNodeId: "End",
      conditionalPaths: [
        { fromNodeId: "Start", condition: "success", toNodeId: "SuccessPath" },
        { fromNodeId: "Start", condition: "failure", toNodeId: "FailurePath" },
      ],
    };
    const graph = buildMermaidGraph(options);
    expect(graph).toContain("Start -- success --> SuccessPath");
    expect(graph).toContain("Start -- failure --> FailurePath");
  });

  it("should include temporal constraints when provided", () => {
    const options: AdvancedGraphOptions = {
      graphTitle: "Temporal Test",
      startNodeId: "Start",
      endNodeId: "End",
      temporalConstraints: [
        { fromNodeId: "Start", toNodeId: "Step1", delay: 2 },
        { fromNodeId: "Step1", toNodeId: "End", delay: 1 },
      ],
    };
    const graph = buildMermaidGraph(options);
    expect(graph).toContain("Start -- delay 2 --> Step1");
    expect(graph).toContain("Step1 -- delay 1 --> End");
  });
});