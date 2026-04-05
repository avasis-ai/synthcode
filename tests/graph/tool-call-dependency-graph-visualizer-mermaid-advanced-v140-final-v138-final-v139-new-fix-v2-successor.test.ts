import { describe, it, expect } from "vitest";
import { GraphNode, GraphEdge, ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v140-final-v138-final-v139-new-fix-v2-successor";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic mermaid graph for a simple linear flow", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "start", label: "Start", dependencies: [] },
      { id: "process1", type: "process", label: "Process Step 1", dependencies: [] },
      { id: "end", type: "end", label: "End", dependencies: [] },
    ];
    const edges: GraphEdge[] = [
      { from: "start", to: "process1" },
      { from: "process1", to: "end" },
    ];

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(nodes, edges);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start[Start]");
    expect(mermaidCode).toContain("process1[Process Step 1]");
    expect(mermaidCode).toContain("end[End]");
    expect(mermaidCode).toContain("start --> process1");
    expect(mermaidCode).toContain("process1 --> end");
  });

  it("should handle conditional branching paths", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "start", label: "Start", dependencies: [] },
      { id: "decision", type: "decision", label: "Decision Point", dependencies: [] },
      { id: "success", type: "process", label: "Success Path", dependencies: [] },
      { id: "failure", type: "process", label: "Failure Path", dependencies: [] },
      { id: "end", type: "end", label: "End", dependencies: [] },
    ];
    const edges: GraphEdge[] = [
      { from: "start", to: "decision" },
      { from: "decision", to: "success", condition: "Success" },
      { from: "decision", to: "failure", condition: "Failure" },
      { from: "success", to: "end" },
      { from: "failure", to: "end" },
    ];

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(nodes, edges);

    expect(mermaidCode).toContain("decision{Decision Point}");
    expect(mermaidCode).toContain("decision -- Success --> success");
    expect(mermaidCode).toContain("decision -- Failure --> failure");
    expect(mermaidCode).toContain("success --> end");
    expect(mermaidCode).toContain("failure --> end");
  });

  it("should correctly format nodes with different types", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "start", label: "Start", dependencies: [] },
      { id: "decision", type: "decision", label: "Is it possible?", dependencies: [] },
      { id: "process", type: "process", label: "Execute Action", dependencies: [] },
      { id: "end", type: "end", label: "Finished", dependencies: [] },
    ];
    const edges: GraphEdge[] = [
      { from: "start", to: "decision" },
      { from: "decision", to: "process" },
      { from: "process", to: "end" },
    ];

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(nodes, edges);

    expect(mermaidCode).toContain("start[Start]");
    expect(mermaidCode).toContain("decision{Is it possible?} -- Success --> process[Execute Action]");
    expect(mermaidCode).toContain("process[Execute Action] --> end[Finished]");
  });
});