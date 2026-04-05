import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV114 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v114";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV114", () => {
    it("should generate a basic graph structure for user-assistant interaction", () => {
        const messages = [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there!" }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV114(messages);
        const graph = visualizer.generateMermaidGraph();
        expect(graph).toContain("graph TD");
        expect(graph).toContain("U-0[User]");
        expect(graph).toContain("A-0[Assistant]");
    });

    it("should handle multiple tool calls correctly", () => {
        const messages = [
            { role: "user", content: "Call tool 1 and tool 2" },
            { role: "assistant", content: "Tool call 1", toolCalls: [{ name: "tool1", args: {} }] },
            { role: "assistant", content: "Tool call 2", toolCalls: [{ name: "tool2", args: {} }] }
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV114(messages);
        const graph = visualizer.generateMermaidGraph();
        expect(graph).toContain("tool1");
        expect(graph).toContain("tool2");
    });

    it("should generate an empty graph if no messages are provided", () => {
        const messages: any[] = [];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV114(messages);
        const graph = visualizer.generateMermaidGraph();
        expect(graph).toBe("graph TD\n");
    });
});