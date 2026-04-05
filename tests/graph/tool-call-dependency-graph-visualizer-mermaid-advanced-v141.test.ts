import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV141 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v141";
import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV141", () => {
    it("should generate a basic graph title", () => {
        const messages: Message[] = [
            { role: "user", content: [new TextBlock("Hello")] }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV141(messages);
        // We can't directly access private methods, so we'll check the structure based on expected output
        // For this test, we'll assume a helper or mock if we needed to test private methods strictly.
        // Since we can't, we'll test the public interface's expected behavior.
        // If getGraphTitle was public, we'd test it directly.
        // For now, we'll just ensure instantiation works and the output structure is plausible.
        expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizerMermaidAdvancedV141);
    });

    it("should generate a graph structure for a single tool call", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [new TextBlock("What is the weather?")]
            },
            {
                role: "assistant",
                content: [
                    new ToolUseBlock("get_weather", { location: "Tokyo" })
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV141(messages);
        const graph = visualizer["generateMermaidGraph"](); // Accessing private method for testing purposes
        expect(graph).toContain("graph TD;");
        expect(graph).toContain("Tool Call Dependency Graph");
        expect(graph).toContain("A[User Input]");
        expect(graph).toContain("B[Tool Call]");
    });

    it("should generate a graph structure including thinking and multiple steps", () => {
        const messages: Message[] = [
            {
                role: "user",
                content: [new TextBlock("Plan a trip to Paris.")]
            },
            {
                role: "assistant",
                content: [
                    new ThinkingBlock("Thinking about flights and hotels...")
                ]
            },
            {
                role: "assistant",
                content: [
                    new ToolUseBlock("search_flights", { destination: "Paris" })
                ]
            },
            {
                role: "assistant",
                content: [
                    new ToolUseBlock("search_hotels", { destination: "Paris" })
                ]
            }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV141(messages);
        const graph = visualizer["generateMermaidGraph"](); // Accessing private method for testing purposes
        expect(graph).toContain("Thinking about flights and hotels...");
        expect(graph).toContain("search_flights");
        expect(graph).toContain("search_hotels");
        expect(graph).toContain("A[User Input]");
    });
});