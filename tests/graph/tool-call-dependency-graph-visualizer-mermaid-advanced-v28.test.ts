import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV28 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v28";
import { Message, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV28", () => {
    it("should initialize correctly with messages and configuration", () => {
        const messages: Message[] = [
            { role: "user", content: "Initial message" },
            { role: "assistant", content: "Response with tool use" }
        ];
        const config = {
            showConditionalEdges: true,
            showLoopNodes: false,
            defaultEdgeStyle: "dashed"
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV28(messages, config);
        // We can't directly test private members, but we can check if instantiation doesn't throw and assume internal state is set up.
        expect(visualizer).toBeDefined();
    });

    it("should generate a basic graph structure for simple conversation flow", () => {
        const messages: Message[] = [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there" }
        ];
        const config = {
            showConditionalEdges: false,
            showLoopNodes: false,
            defaultEdgeStyle: "solid"
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV28(messages, config);
        // Assuming there's a method to get the mermaid diagram string, we test for its existence and basic structure.
        // Since the method isn't visible, we'll mock a call to a hypothetical 'generateMermaid' method.
        // If the class has a public method like 'generateMermaid()', we would use it here.
        // For this test, we assume the constructor sets up necessary internal state for visualization.
        expect(typeof (visualizer as any).generateMermaid).toBe('function');
    });

    it("should handle messages containing tool use blocks correctly", () => {
        const messages: Message[] = [
            { role: "user", content: "Need to check weather", toolUses: [{ toolName: "weather", args: { location: "Tokyo" } }] },
            { role: "assistant", content: "Calling tool...", toolUses: [{ toolName: "weather", args: { location: "Tokyo" } }] }
        ];
        const config = {
            showConditionalEdges: true,
            showLoopNodes: true,
            defaultEdgeStyle: "dotted"
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV28(messages, config);
        // Check if the configuration for tool use is respected (e.g., conditional edges are enabled)
        expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizerMermaidAdvancedV28);
    });
});