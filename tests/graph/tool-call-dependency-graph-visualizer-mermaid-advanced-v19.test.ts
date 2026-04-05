import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV19 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v19";
import { Message, ToolUseBlock, TextBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV19", () => {
    it("should initialize correctly with messages and config", () => {
        const messages: Message[] = [
            { role: "user", content: [{ type: "text", content: "Hello" }] }
        ];
        const config = { graphTitle: "Test Graph", defaultStyle: "default" };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV19(messages, config);

        // We can't directly test private members, but we can test the public behavior
        // which relies on correct initialization.
        expect(visualizer).toBeDefined();
    });

    it("should generate a basic graph structure for simple conversation", () => {
        const messages: Message[] = [
            { role: "user", content: [{ type: "text", content: "What is the capital of France?" }] },
            { role: "assistant", content: [{ type: "text", content: "Paris." }] }
        ];
        const config = { graphTitle: "Simple Chat", defaultStyle: "default" };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV19(messages, config);

        // Assuming the generated mermaid code contains expected markers for basic flow
        const mermaidCode = visualizer.generateMermaidGraph();
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User]");
        expect(mermaidCode).toContain("B[Assistant]");
    });

    it("should correctly represent a tool call dependency", () => {
        const messages: Message[] = [
            { role: "user", content: [{ type: "text", content: "Get weather for London" }] },
            { role: "assistant", content: [{ type: "tool_use", toolCall: { name: "get_weather", args: { city: "London" } } }] },
            { role: "tool", content: [{ type: "tool_output", toolCallId: "call_1", output: { temperature: "15C", condition: "Cloudy" } }] }
        ];
        const config = { graphTitle: "Tool Flow", defaultStyle: "default" };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV19(messages, config);

        const mermaidCode = visualizer.generateMermaidGraph();
        expect(mermaidCode).toContain("A[User]");
        expect(mermaidCode).toContain("B[Tool Call: get_weather]");
        expect(mermaidCode).toContain("C[Tool Output]");
    });
});