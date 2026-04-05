import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v137-enhanced";
import { GraphContext } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v137-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic mermaid graph for a simple linear flow", () => {
    const context: GraphContext = {
      nodes: [
        { id: "start", type: "start", label: "Start", details: {} },
        { id: "tool1", type: "tool_call", label: "Tool A", details: {} },
        { id: "end", type: "end", label: "End", details: {} },
      ],
      edges: [
        { fromId: "start", toId: "tool1" },
        { fromId: "tool1", toId: "end" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("start[Start]");
    expect(mermaidCode).toContain("tool1[Tool A]");
    expect(mermaidCode).toContain("start --> tool1");
    expect(mermaidCode).toContain("tool1 --> end");
  });

  it("should handle conditional branching correctly", () => {
    const context: GraphContext = {
      nodes: [
        { id: "start", type: "start", label: "Start", details: {} },
        { id: "check", type: "conditional", label: "Check Condition", details: {} },
        { id: "true_path", type: "tool_call", label: "True Path", details: {} },
        { id: "false_path", type: "tool_call", label: "False Path", details: {} },
        { id: "end", type: "end", label: "End", details: {} },
      ],
      edges: [
        { fromId: "start", toId: "check" },
        { fromId: "check", toId: "true_path", condition: "true" },
        { fromId: "check", toId: "false_path", condition: "false" },
        { fromId: "true_path", toId: "end" },
        { fromId: "false_path", toId: "end" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);
    expect(mermaidCode).toContain("check{Check Condition}");
    expect(mermaidCode).toContain("check -- true --> true_path");
    expect(mermaidCode).toContain("check -- false --> false_path");
    expect(mermaidCode).toContain("true_path --> end");
  });

  it("should include labels for edges with specific conditions", () => {
    const context: GraphContext = {
      nodes: [
        { id: "start", type: "start", label: "Start", details: {} },
        { id: "decision", type: "conditional", label: "Decision Point", details: {} },
        { id: "next", type: "tool_call", label: "Next Step", details: {} },
        { id: "end", type: "end", label: "End", details: {} },
      ],
      edges: [
        { fromId: "start", toId: "decision" },
        { fromId: "decision", toId: "next", condition: "Success" },
        { fromId: "decision", toId: "end", condition: "Failure" },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidCode = visualizer.generateGraph(context);
    expect(mermaidCode).toContain("decision -- Success --> next");
    expect(mermaidCode).toContain("decision -- Failure --> end");
  });
});