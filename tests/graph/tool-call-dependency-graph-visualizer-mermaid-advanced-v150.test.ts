import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV150 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v150";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV150", () => {
    it("should generate a basic graph structure for simple tool calls", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV150();
        const messages = [
            { role: "user", content: { type: "text", text: "Call tool A and then tool B" } },
            { role: "assistant", content: { type: "tool_use", toolUse: { id: "call1", name: "toolA", input: {} } } },
            { role: "assistant", content: { type: "tool_use", toolUse: { id: "call2", name: "toolB", input: {} } } },
        ];
        const toolCalls = [
            { id: "call1", name: "toolA", input: {} },
            { id: "call2", name: "toolB", input: {} },
        ];

        const mermaidCode = visualizer.generateGraph(messages, toolCalls);
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User Input]");
        expect(mermaidCode).toContain("B[Tool A Call]");
        expect(mermaidCode).toContain("C[Tool B Call]");
    });

    it("should handle conditional logic (if/else) in the graph", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV150();
        const messages = [
            { role: "user", content: { type: "text", text: "Check condition X" } },
            // Assume the structure implies a conditional flow
        ];
        const toolCalls = [];

        // Mocking the internal state or calling a specific method if available for complex flow
        // Since we don't have the full implementation, we test for expected keywords related to flow control.
        const mermaidCode = visualizer.generateGraph(messages, toolCalls);
        expect(mermaidCode).toContain("if");
        expect(mermaidCode).toContain("else");
    });

    it("should correctly represent a loop dependency", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV150();
        const messages = [
            { role: "user", content: { type: "text", text: "Process items in a loop" } },
        ];
        const toolCalls = [];

        const mermaidCode = visualizer.generateGraph(messages, toolCalls);
        expect(mermaidCode).toContain("loop");
        expect(mermaidCode).toContain("repeat");
    });
});