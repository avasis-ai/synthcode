import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV16 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v16";
import { GraphContext, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV16", () => {
    it("should generate a basic graph structure for a simple user message", () => {
        const mockContext: GraphContext = {
            messages: [
                { role: "user", content: "Hello world", blocks: [new TextBlock("Hello world")] }
            ]
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV16(mockContext);
        const mermaidCode = visualizer.generateGraph();
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("user_Hello_0");
    });

    it("should correctly represent a message with a tool use block", () => {
        const mockContext: GraphContext = {
            messages: [
                { role: "assistant", content: "Tool call", blocks: [new ToolUseBlock("tool_name", ["arg1"])] }
            ]
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV16(mockContext);
        const mermaidCode = visualizer.generateGraph();
        expect(mermaidCode).toContain("assistant_Tool call_0");
        expect(mermaidCode).toContain("tool_name");
    });

    it("should handle multiple messages and different block types", () => {
        const mockContext: GraphContext = {
            messages: [
                { role: "user", content: "Start", blocks: [new TextBlock("Start")] },
                { role: "assistant", content: "Thinking", blocks: [new ThinkingBlock("thought")] }
            ]
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV16(mockContext);
        const mermaidCode = visualizer.generateGraph();
        expect(mermaidCode).toContain("user_Start_0");
        expect(mermaidCode).toContain("assistant_Thinking_1");
    });
});