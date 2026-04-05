import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV5 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v5";
import { Message, ToolUseBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV5", () => {
    it("should generate a basic graph when only one tool call exists", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [
                    { type: "text", content: "What is the weather like?" }
                ]
            },
            {
                role: "model",
                content: [
                    {
                        type: "tool_use",
                        tool_use: {
                            tool_use_id: "call_1",
                            tool_name: "get_weather",
                            input: { location: "San Francisco" }
                        } as ToolUseBlock
                    }
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV5(messages);
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("graph TD");
        expect(mermaidGraph).toContain("A[User Input]");
        expect(mermaidGraph).toContain("B(Tool Call: get_weather)");
        expect(mermaidGraph).toContain("A --> B");
    });

    it("should handle multiple tool calls in sequence", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [
                    { type: "text", content: "First, get the weather, then find the nearest restaurant." }
                ]
            },
            {
                role: "model",
                content: [
                    {
                        type: "tool_use",
                        tool_use: {
                            tool_use_id: "call_1",
                            tool_name: "get_weather",
                            input: { location: "San Francisco" }
                        } as ToolUseBlock
                    }
                ]
            },
            {
                role: "model",
                content: [
                    {
                        type: "tool_use",
                        tool_use: {
                            tool_use_id: "call_2",
                            tool_name: "find_restaurant",
                            input: { query: "Italian" }
                        } as ToolUseBlock
                    }
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV5(messages);
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("call_1");
        expect(mermaidGraph).toContain("call_2");
        expect(mermaidGraph).toContain("call_1 --> call_2");
    });

    it("should generate an empty graph if no tool calls are present", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [
                    { type: "text", content: "Hello, how are you?" }
                ]
            },
            {
                role: "model",
                content: [
                    { type: "text", content: "I am doing well, thank you!" }
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV5(messages);
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("graph TD");
        expect(mermaidGraph).not.toContain("tool_use");
    });
});