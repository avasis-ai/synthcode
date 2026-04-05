import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV18 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v18";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV18", () => {
  it("should initialize correctly with a context", () => {
    const context: any = {
      messages: [],
      toolCalls: {},
      dependencies: {},
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV18(context);
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizerMermaidAdvancedV18);
  });

  it("should generate an empty graph definition when no context is provided", () => {
    const context: any = {
      messages: [],
      toolCalls: {},
      dependencies: {},
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV18(context);
    const graphDefinition = visualizer.generateGraphDefinition();
    expect(graphDefinition).toBeDefined();
    // Assuming an empty graph definition results in a basic structure
    expect(graphDefinition.mermaidCode).toContain("graph TD");
  });

  it("should update the graph definition when new tool calls are added to the context", () => {
    const context: any = {
      messages: [
        { type: "user", content: "Call tool A" }
      ],
      toolCalls: {
        "toolA": { name: "toolA", input: { param: "value" } }
      },
      dependencies: {
        "toolA": []
      }
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV18(context);
    const graphDefinition = visualizer.generateGraphDefinition();
    expect(graphDefinition.mermaidCode).toContain("toolA");
    expect(graphDefinition.mermaidCode).toContain("A[\"Tool A\"]");
  });
});