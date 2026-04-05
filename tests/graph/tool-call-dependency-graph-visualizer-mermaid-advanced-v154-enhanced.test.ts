import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v154-enhanced";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced", () => {
  it("should generate a basic graph structure for simple tool calls", () => {
    const context: AdvancedGraphContext = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", content: "What is the weather?" },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              toolUse: {
                toolName: "get_weather",
                toolInput: { location: "New York" },
              },
            },
          ],
        },
        {
          role: "tool",
          content: [
            { type: "text", content: "The weather in New York is sunny." },
          ],
        },
      ],
      // Minimal context for testing basic flow
    } as unknown as AdvancedGraphContext;

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced(context);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[User Input]");
    expect(mermaidDiagram).toContain("B[Tool Call: get_weather]");
    expect(mermaidDiagram).toContain("C[Tool Output]");
  });

  it("should handle conditional paths correctly in the mermaid diagram", () => {
    const context: AdvancedGraphContext = {
      messages: [],
      conditionalPaths: [
        {
          condition: "user_query_is_urgent",
          truePath: "Path A",
          falsePath: "Path B",
        },
      ],
    } as unknown as AdvancedGraphContext;

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced(context);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("conditional_path_user_query_is_urgent");
    expect(mermaidDiagram).toContain("-->|True| Path A");
    expect(mermaidDiagram).toContain("-->|False| Path B");
  });

  it("should include loop iteration information when present", () => {
    const context: AdvancedGraphContext = {
      messages: [],
      loopIterations: [
        { loopId: "search_results", iterations: 3 },
      ],
    } as unknown as AdvancedGraphContext;

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced(context);
    const mermaidDiagram = visualizer.generateMermaidDiagram();

    expect(mermaidDiagram).toContain("loop_search_results");
    expect(mermaidDiagram).toContain("Iterations: 3");
  });
});