import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v4";

describe("ToolCallDependencyGraphVisualizer", () => {
    it("should generate a basic graph structure for a simple user-assistant exchange", () => {
        const visualizer = new ToolCallDependencyGraphVisualizer();
        const messages = [
            { role: "user", content: { type: "text", text: "Hello world" } },
            { role: "assistant", content: { type: "text", text: "Hi there!" } }
        ];
        const mermaidCode = visualizer.generateGraph(messages);
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("U1");
        expect(mermaidCode).toContain("A1");
    });

    it("should handle multiple tool calls and dependencies correctly", () => {
        const visualizer = new ToolCallDependencyGraphVisualizer();
        const messages = [
            { role: "user", content: { type: "text", text: "Call tool A and then tool B" } },
            { role: "assistant", content: { type: "tool_use", tool_use: { tool_name: "toolA", tool_input: { param: "value1" } } } },
            { role: "tool", content: { type: "tool_output", tool_output: { tool_name: "toolA", output: "resultA" } } },
            { role: "assistant", content: { type: "tool_use", tool_use: { tool_name: "toolB", tool_input: { param: "value2" } } } }
        ];
        const mermaidCode = visualizer.generateGraph(messages);
        expect(mermaidCode).toContain("toolA");
        expect(mermaidCode).toContain("toolB");
        expect(mermaidCode).toContain("toolA --> toolB"); // Check for dependency flow
    });

    it("should generate an empty graph string for an empty message array", () => {
        const visualizer = new ToolCallDependencyGraphVisualizer();
        const messages: any[] = [];
        const mermaidCode = visualizer.generateGraph(messages);
        expect(mermaidCode).toBe("");
    });
});