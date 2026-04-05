import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV144Final } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v144-final";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV144Final", () => {
  it("should generate a basic graph for a simple successful tool call sequence", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144Final();
    const graph = visualizer.generateGraph(
      [
        { type: "start", label: "Start" },
        { type: "tool_call", label: "Call Tool A", details: { toolName: "ToolA" } },
        { type: "tool_result", label: "Result A", details: { result: "Success" } },
        { type: "end", label: "End" },
      ],
      [
        { from: "Start", to: "Call Tool A", type: "success" },
        { from: "Call Tool A", to: "Result A", type: "success" },
        { from: "Result A", to: "End", type: "success" },
      ]
    );
    expect(graph).toContain("graph TD");
    expect(graph).toContain("Start --> Call Tool A");
    expect(graph).toContain("Call Tool A --> Result A");
    expect(graph).toContain("Result A --> End");
  });

  it("should generate a graph with a conditional branch (e.g., failure fallback)", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144Final();
    const graph = visualizer.generateGraph(
      [
        { type: "start", label: "Start" },
        { type: "tool_call", label: "Call Tool B", details: { toolName: "ToolB" } },
        { type: "tool_result", label: "Success Path", details: { result: "Success" } },
        { type: "tool_result", label: "Failure Path", details: { result: "Failure" } },
        { type: "end", label: "End" },
      ],
      [
        { from: "Start", to: "Call Tool B", type: "success" },
        { from: "Call Tool B", to: "Success Path", type: "success" },
        { from: "Call Tool B", to: "Failure Path", type: "failure", condition: "Error" },
        { from: "Success Path", to: "End", type: "success" },
        { from: "Failure Path", to: "End", type: "fallback" },
      ]
    );
    expect(graph).toContain("graph TD");
    expect(graph).toContain("Start --> Call Tool B");
    expect(graph).toContain("Call Tool B --> Success Path");
    expect(graph).toContain("Call Tool B -- Error --> Failure Path");
    expect(graph).toContain("Failure Path --> End");
  });

  it("should handle a loop structure correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144Final();
    const graph = visualizer.generateGraph(
      [
        { type: "start", label: "Start" },
        { type: "tool_call", label: "Loop Check", details: { toolName: "LoopTool" } },
        { type: "loop_body", label: "Loop Body", details: { iterations: 1 } },
        { type: "end", label: "End" },
      ],
      [
        { from: "Start", to: "Loop Check", type: "success" },
        { from: "Loop Check", to: "Loop Body", type: "success" },
        { from: "Loop Body", to: "Loop Check", type: "loop" },
        { from: "Loop Body", to: "End", type: "success" },
      ]
    );
    expect(graph).toContain("graph TD");
    expect(graph).toContain("Start --> Loop Check");
    expect(graph).toContain("Loop Check --> Loop Body");
    expect(graph).toContain("Loop Body --> Loop Check");
    expect(graph).toContain("Loop Body --> End");
  });
});