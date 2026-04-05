import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV8 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v8";
import { Message, ToolUseBlock, TextBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV8", () => {
    it("should generate an empty graph when no assistant messages are present", () => {
        const messages: Message[] = [
            { role: "user", content: [{ type: "text", content: "Hello" }] },
            { role: "user", content: [{ type: "text", content: "World" }] },
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV8(messages);
        const graph = visualizer.generateGraph();
        expect(graph).toBe("");
    });

    it("should generate a basic graph for a single tool call", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [{ type: "text", content: "What is the weather?" }],
            },
            {
                role: "assistant",
                content: [
                    {
                        type: "tool_use",
                        content: {
                            tool_uses: [{
                                tool_name: "get_weather",
                                tool_call_id: "call_1",
                                arguments: { location: "Tokyo" },
                            }],
                        },
                    },
                ],
            },
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV8(messages);
        const graph = visualizer.generateGraph();
        expect(graph).toContain("graph TD");
        expect(graph).toContain("A[User Input]");
        expect(graph).toContain("B[Tool Call: get_weather]");
    });

    it("should handle multiple tool calls and text blocks correctly", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [{ type: "text", content: "Check weather and summarize." }],
            },
            {
                role: "assistant",
                content: [
                    {
                        type: "tool_use",
                        content: {
                            tool_uses: [{
                                tool_name: "get_weather",
                                tool_call_id: "call_1",
                                arguments: { location: "Tokyo" },
                            }],
                        },
                    },
                    {
                        type: "text",
                        content: "Here is the summary.",
                    },
                ],
            },
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV8(messages);
        const graph = visualizer.generateGraph();
        expect(graph).toContain("graph TD");
        expect(graph).toContain("A[User Input]");
        expect(graph).toContain("B[Tool Call: get_weather]");
        expect(graph).toContain("C[Summary]");
    });
});