import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should initialize correctly with basic graph context", () => {
    const nodes = new Map<string, any>();
    nodes.set("start", { id: "start", type: "start" });
    const edges = [];
    const flowControl = [];
    const context = { nodes, edges, flowControl };

    const visualizer = new ToolCallDependencyGraphVisualizer(context);

    expect(visualizer).toBeDefined();
  });

  it("should generate a basic mermaid graph string from simple nodes and edges", () => {
    const nodes = new Map<string, any>();
    nodes.set("A", { id: "A", type: "node" });
    nodes.set("B", { id: "B", type: "node" });
    const edges = [{ from: "A", to: "B", label: "Success" }];
    const flowControl = [];
    const context = { nodes, edges, flowControl };

    const visualizer = new ToolCallDependencyGraphVisualizer(context);
    const mermaidString = visualizer.generateMermaidGraph();

    expect(mermaidString).toContain("graph TD");
    expect(mermaidString).toContain("A[A]");
    expect(mermaidString).toContain("B[B]");
    expect(mermaidString).toContain("A -- Success --> B");
  });

  it("should incorporate flow control logic into the mermaid graph", () => {
    const nodes = new Map<string, any>();
    nodes.set("start", { id: "start", type: "start" });
    nodes.set("decision", { id: "decision", type: "decision" });
    nodes.set("success_path", { id: "success_path", type: "node" });
    nodes.set("failure_path", { id: "failure_path", type: "node" });
    const edges = [];
    const flowControl = [
      { type: "conditional", sourceId: "decision", targetId: "success_path", condition: "Success" },
      { type: "conditional", sourceId: "decision", targetId: "failure_path", condition: "Failure" },
    ];
    const context = { nodes, edges, flowControl };

    const visualizer = new ToolCallDependencyGraphVisualizer(context);
    const mermaidString = visualizer.generateMermaidGraph();

    expect(mermaidString).toContain("decision");
    expect(mermaidString).toContain("decision -- Success --> success_path");
    expect(mermaidString).toContain("decision -- Failure --> failure_path");
  });
});