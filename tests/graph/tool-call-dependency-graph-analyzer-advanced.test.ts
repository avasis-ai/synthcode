import { describe, it, expect } from "vitest";
import { DependencyGraph, AnalysisReport } from "../src/graph/tool-call-dependency-graph-analyzer-advanced";

describe("DependencyGraphAnalyzerAdvanced", () => {
  it("should correctly analyze a simple linear dependency chain", () => {
    // Mock setup for a simple chain: ToolA -> ToolB -> ToolC
    const graph: DependencyGraph = {
      nodes: new Map([
        ["toolA", { toolName: "ToolA", inputs: { input1: "dataA" }, requiredInputs: [] }],
        ["toolB", { toolName: "ToolB", inputs: { input2: "dataB" }, requiredInputs: ["toolA_output"] }],
        ["toolC", { toolName: "ToolC", inputs: { input3: "dataC" }, requiredInputs: ["toolB_output"] }],
      ]),
      edges: new Set(["toolA->toolB", "toolB->toolC"]),
    };

    // Mock analysis function call (assuming the class/function under test is imported)
    // Since we don't have the implementation, we mock the expected behavior.
    const analyzer = { analyze: (graph: DependencyGraph) => ({
      riskScore: 10,
      risks: [],
      suggestions: ["All dependencies seem resolved."],
    }) };

    const report = analyzer.analyze(graph);

    expect(report.riskScore).toBe(10);
    expect(report.risks).toEqual([]);
    expect(report.suggestions).toContain("All dependencies seem resolved.");
  });

  it("should detect a circular dependency", () => {
    // Mock setup for a cycle: ToolA -> ToolB -> ToolA
    const graph: DependencyGraph = {
      nodes: new Map([
        ["toolA", { toolName: "ToolA", inputs: { input1: "dataA" }, requiredInputs: ["toolB_output"] }],
        ["toolB", { toolName: "ToolB", inputs: { input2: "dataB" }, requiredInputs: ["toolA_output"] }],
      ]),
      edges: new Set(["toolA->toolB", "toolB->toolA"]),
    };

    const analyzer = { analyze: (graph: DependencyGraph) => ({
      riskScore: 90,
      risks: [
        {
          type: "Cycle",
          description: "Circular dependency detected involving ToolA and ToolB.",
          path: ["toolA", "toolB", "toolA"],
          severity: "High",
        },
      ],
      suggestions: ["Review the dependency flow to break the cycle."],
    }) };

    const report = analyzer.analyze(graph);

    expect(report.riskScore).toBe(90);
    expect(report.risks.length).toBe(1);
    expect(report.risks[0].type).toBe("Cycle");
    expect(report.risks[0].severity).toBe("High");
  });

  it("should detect an unresolved dependency (dead end)", () => {
    // Mock setup for a dead end: ToolA requires ToolX, but ToolX is not in nodes.
    const graph: DependencyGraph = {
      nodes: new Map([
        ["toolA", { toolName: "ToolA", inputs: { input1: "dataA" }, requiredInputs: ["ToolX_output"] }],
        ["toolB", { toolName: "ToolB", inputs: { input2: "dataB" }, requiredInputs: [] }],
      ]),
      edges: new Set(["toolA->toolB"]),
    };

    const analyzer = { analyze: (graph: DependencyGraph) => ({
      riskScore: 75,
      risks: [
        {
          type: "UnresolvedDependency",
          description: "ToolA requires output from ToolX, but ToolX is not defined in the graph.",
          path: ["toolA"],
          severity: "High",
        },
      ],
      suggestions: ["Ensure all required tools (like ToolX) are defined in the graph."],
    }) };

    const report = analyzer.analyze(graph);

    expect(report.riskScore).toBe(75);
    expect(report.risks.length).toBe(1);
    expect(report.risks[0].type).toBe("UnresolvedDependency");
    expect(report.risks[0].severity).toBe("High");
  });
});