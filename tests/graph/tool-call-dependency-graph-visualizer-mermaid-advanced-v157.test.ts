import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV157 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v157";
import { Message, ToolUseBlock, ThinkingBlock, ContentBlock, ToolResultMessage } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV157", () => {
  it("should generate a basic mermaid graph for a simple tool call sequence", () => {
    const mockGraphContext: any = {
      nodes: [
        { id: "user_msg", type: "user", content: "What is the weather?", blocks: [{ type: "text", content: "What is the weather?" }] },
        { id: "tool_call_1", type: "assistant", content: "Tool call for weather", blocks: [{ type: "tool_use", tool_name: "weather_api", input: "London" }] },
        { id: "tool_result_1", type: "tool_result", content: "Weather in London is 20C", blocks: [{ type: "tool_result", result: "20C" }] },
      ],
      dependencies: [
        { from: "user_msg", to: "tool_call_1", type: "calls" },
        { from: "tool_call_1", to: "tool_result_1", type: "follows" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV157(mockGraphContext);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("user_msg -->|calls| tool_call_1");
    expect(mermaidCode).toContain("tool_call_1 -->|follows| tool_result_1");
  });

  it("should handle conditional dependencies correctly", () => {
    const mockGraphContext: any = {
      nodes: [
        { id: "user_msg", type: "user", content: "Should I book a flight?", blocks: [{ type: "text", content: "Should I book a flight?" }] },
        { id: "tool_call_1", type: "assistant", content: "Suggesting flight options", blocks: [{ type: "tool_use", tool_name: "flight_api", input: "NYC" }] },
        { id: "conditional_step", type: "assistant", content: "If user confirms", blocks: [{ type: "thinking", content: "Awaiting confirmation" }] },
      ],
      dependencies: [
        { from: "user_msg", to: "tool_call_1", type: "calls" },
        { from: "tool_call_1", to: "conditional_step", type: "conditional", condition: "User confirms booking" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV157(mockGraphContext);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("user_msg -->|calls| tool_call_1");
    expect(mermaidCode).toContain("tool_call_1 -->|conditional| conditional_step");
    expect(mermaidCode).toContain("condition: User confirms booking");
  });

  it("should generate an empty graph if no dependencies exist", () => {
    const mockGraphContext: any = {
      nodes: [
        { id: "user_msg", type: "user", content: "Hello", blocks: [{ type: "text", content: "Hello" }] },
      ],
      dependencies: [],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV157(mockGraphContext);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).not.toContain("-->");
  });
});