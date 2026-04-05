import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV159 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v159";
import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV159", () => {
  it("should generate a basic graph structure for direct dependencies", () => {
    const context: AdvancedGraphContext = {
      messages: [
        { role: "user", content: [{ type: "text", content: "Start process" }] },
        { role: "assistant", content: [{ type: "tool_use", toolUse: { toolName: "toolA", toolCallId: "call1" } }] },
        { role: "user", content: [{ type: "text", content: "Next step" }] },
        { role: "assistant", content: [{ type: "tool_use", toolUse: { toolName: "toolB", toolCallId: "call2" } }] },
      ],
      dependencies: [
        { sourceId: "call1", targetId: "call2", type: "direct" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV159(context);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("call1 --> call2");
  });

  it("should handle conditional dependencies", () => {
    const context: AdvancedGraphContext = {
      messages: [
        { role: "user", content: [{ type: "text", content: "Check condition" }] },
        { role: "assistant", content: [{ type: "tool_use", toolUse: { toolName: "checkCondition", toolCallId: "call1" } }] },
      ],
      dependencies: [
        { sourceId: "call1", targetId: "call2", type: "conditional", condition: "success" },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV159(context);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("call1 --|> call2");
    expect(mermaidCode).toContain("if success");
  });

  it("should include loop dependencies", () => {
    const context: AdvancedGraphContext = {
      messages: [
        { role: "user", content: [{ type: "text", content: "Loop execution" }] },
        { role: "assistant", content: [{ type: "tool_use", toolUse: { toolName: "loopTool", toolCallId: "call1" } }] },
      ],
      dependencies: [
        { sourceId: "call1", targetId: "call1", type: "loop", loopIterations: 3 },
      ],
    };

    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV159(context);
    const mermaidCode = visualizer.generateMermaidGraph();

    expect(mermaidCode).toContain("call1 -- loop");
    expect(mermaidCode).toContain("loopIterations: 3");
  });
});