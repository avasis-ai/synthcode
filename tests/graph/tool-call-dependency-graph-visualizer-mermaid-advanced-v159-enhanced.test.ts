import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v159-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic graph structure for a simple successful tool call flow", () => {
    const graphData: ToolCallDependencyGraph = {
      messages: [
        { type: "user", content: "What is the weather?" } as UserMessage,
        { type: "assistant", content: "Calling weather tool..." } as AssistantMessage,
        { type: "tool_result", content: "Sunny with 25C" } as ToolResultMessage,
        { type: "assistant", content: "The weather is sunny." } as AssistantMessage,
      ],
      flowControlNodes: [
        { id: "start", description: "Start", condition: "success", successPathId: "call_tool", failurePathId: "end" },
        { id: "call_tool", description: "Tool Call", condition: "success", successPathId: "success_path", failurePathId: "failure_path" },
        { id: "success_path", description: "Success", condition: "success", successPathId: "end", failurePathId: "end" },
        { id: "failure_path", description: "Failure", condition: "success", successPathId: "end", failurePathId: "end" },
        { id: "end", description: "End", condition: "success", successPathId: "", failurePathId: "" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidDiagram = visualizer.generateMermaid(graphData);

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("A[Start]");
    expect(mermaidDiagram).toContain("B{Tool Call}");
    expect(mermaidDiagram).toContain("A -->|success| B");
  });

  it("should handle a flow with explicit failure paths", () => {
    const graphData: ToolCallDependencyGraph = {
      messages: [
        { type: "user", content: "Check non-existent tool" } as UserMessage,
        { type: "assistant", content: "Calling tool..." } as AssistantMessage,
        { type: "tool_result", content: "Error: Tool not found" } as ToolResultMessage,
      ],
      flowControlNodes: [
        { id: "start", description: "Start", condition: "success", successPathId: "call_tool", failurePathId: "end" },
        { id: "call_tool", description: "Tool Call", condition: "success", successPathId: "success_path", failurePathId: "failure_path" },
        { id: "success_path", description: "Success", condition: "success", successPathId: "end", failurePathId: "end" },
        { id: "failure_path", description: "Failure", condition: "success", successPathId: "end", failurePathId: "end" },
        { id: "end", description: "End", condition: "success", successPathId: "", failurePathId: "" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidDiagram = visualizer.generateMermaid(graphData);

    expect(mermaidDiagram).toContain("Failure");
    expect(mermaidDiagram).toContain("A -->|failure| C");
  });

  it("should generate an empty or minimal diagram if graphData is empty", () => {
    const graphData: ToolCallDependencyGraph = {
      messages: [],
      flowControlNodes: [],
    };

    const visualizer = new ToolCallDependencyGraphVisualizer();
    const mermaidDiagram = visualizer.generateMermaid(graphData);

    expect(mermaidDiagram).toBe("");
  });
});