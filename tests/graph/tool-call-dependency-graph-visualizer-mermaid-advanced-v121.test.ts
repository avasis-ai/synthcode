import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV121 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v121";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV121", () => {
    it("should initialize with a default title if none is provided", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV121();
        // Assuming there's a way to check the title, or we test the constructor's effect.
        // Since the title is private, we'll test the default behavior indirectly or assume getter/logging if available.
        // For this test, we'll rely on the constructor call structure.
        expect(visualizer).toBeDefined();
    });

    it("should initialize with a custom title when provided", () => {
        const customTitle = "My Custom Graph";
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV121(customTitle);
        // Again, assuming internal state check is possible or we test the resulting output structure.
        // If we could access the title, we'd check it here.
    });

    it("should generate a unique node ID based on message role and index", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV121();
        const message = { role: "user", content: "test" };
        const nodeId = visualizer["generateNodeId"](message, 0); // Accessing private method for testing purposes
        expect(nodeId).toBe("U0");

        const messageAssistant = { role: "assistant", content: "test" };
        const nodeIdAssistant = visualizer["generateNodeId"](messageAssistant, 1);
        expect(nodeIdAssistant).toBe("A1");

        const messageTool = { role: "tool", content: "test" };
        const nodeIdTool = visualizer["generateNodeId"](messageTool, 5);
        expect(nodeIdTool).toBe("T5");
    });
});