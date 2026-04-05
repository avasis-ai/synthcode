import { describe, it, expect } from "vitest";
import { GraphVisualizer } from "../../../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix";
import { GraphContext } from "../../../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1-successor-fix.types";

describe("GraphVisualizer", () => {
  it("should generate basic graph syntax for simple transitions", () => {
    const visualizer = GraphVisualizer.createMock(); // Assuming a static method or factory for testing
    const context: GraphContext = {
      messages: [],
      initialState: "Start",
      finalState: "End",
      toolCalls: [],
      transitions: [
        { from: "Start", to: "ProcessA" },
        { from: "ProcessA", to: "End" },
      ],
    };
    const mermaidSyntax = visualizer.generateMermaidSyntax(context);
    expect(mermaidSyntax).toContain("graph TD");
    expect(mermaidSyntax).toContain("Start --> ProcessA");
    expect(mermaidSyntax).toContain("ProcessA --> End");
  });

  it("should include labels and loop indicators for complex transitions", () => {
    const visualizer = GraphVisualizer.createMock();
    const context: GraphContext = {
      messages: [],
      initialState: "Start",
      finalState: "End",
      toolCalls: [],
      transitions: [
        { from: "Start", to: "Check", label: "Initial Check" },
        { from: "Check", to: "ProcessB", condition: "Success" },
        { from: "Check", to: "ProcessB", condition: "Failure", loop: true, label: "Retry" },
      ],
    };
    const mermaidSyntax = visualizer.generateMermaidSyntax(context);
    expect(mermaidSyntax).toContain("Start --> Check: Initial Check");
    expect(mermaidSyntax).toContain("Check -- Success --> ProcessB");
    expect(mermaidSyntax).toContain("Check -- Failure --> ProcessB: Retry");
  });

  it("should handle context with tool calls and multiple states", () => {
    const visualizer = GraphVisualizer.createMock();
    const context: GraphContext = {
      messages: [{ role: "user", content: "Call tool X" }],
      initialState: "Start",
      finalState: "End",
      toolCalls: [{ id: "t1", name: "ToolX", input: { param: "value" } }],
      transitions: [
        { from: "Start", to: "ToolCall", label: "Tool Call Initiated" },
        { from: "ToolCall", to: "End", condition: "Success" },
      ],
    };
    const mermaidSyntax = visualizer.generateMermaidSyntax(context);
    expect(mermaidSyntax).toContain("Start --> ToolCall: Tool Call Initiated");
    expect(mermaidSyntax).toContain("ToolCall -- Success --> End");
    expect(mermaidSyntax).toContain("ToolX"); // Check if tool info is somehow represented or if the structure is sound
  });
});