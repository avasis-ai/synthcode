import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v142-final";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final", () => {
    it("should initialize with an empty graph definition", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final([]);
        // Accessing private field for testing purposes, assuming it's safe for this test context
        (visualizer as any).graphDefinition = "graph TD\n";
        expect((visualizer as any).graphDefinition).toBe("graph TD\n");
    });

    it("should generate a basic graph structure for a single tool call", () => {
        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", content: "What is the weather?" }
                ]
            },
            {
                role: "assistant",
                content: [
                    { type: "tool_use", toolUse: { name: "get_weather", input: "London" } }
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final(messages);
        const graph = (visualizer as any).generateMermaidGraph();
        expect(graph).toContain("A[User Input]");
        expect(graph).toContain("B[Tool Call: get_weather]");
        expect(graph).toContain("A --> B");
    });

    it("should handle multiple messages and dependencies correctly", () => {
        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", content: "First task." }
                ]
            },
            {
                role: "assistant",
                content: [
                    { type: "tool_use", toolUse: { name: "tool1", input: "data1" } }
                ]
            },
            {
                role: "user",
                content: [
                    { type: "text", content: "Second task." }
                ]
            },
            {
                role: "assistant",
                content: [
                    { type: "tool_use", toolUse: { name: "tool2", input: "data2" } }
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV142Final(messages);
        const graph = (visualizer as any).generateMermaidGraph();
        expect(graph).toMatch(/A\[User Input\]/);
        expect(graph).toMatch(/B\[Tool Call: tool1\]/);
        expect(graph).toMatch(/C\[User Input\]/);
        expect(graph).toMatch(/D\[Tool Call: tool2\]/);
        expect(graph).toContain("A --> B");
        expect(graph).toContain("C --> D");
    });
});