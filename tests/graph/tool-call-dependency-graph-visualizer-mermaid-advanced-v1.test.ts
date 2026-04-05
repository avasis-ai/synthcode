import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV1 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v1";
import { DependencyGraph } from "../src/graph/dependency-graph";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV1", () => {
    it("should correctly generate a node ID for a user message", () => {
        const mockGraph = new DependencyGraph();
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV1(mockGraph);
        const userMessage = { role: "user", id: "user123" };
        const nodeId = visualizer["generateNodeId"](userMessage);
        expect(nodeId).toBe("U-user123");
    });

    it("should correctly generate a node ID for an assistant message", () => {
        const mockGraph = new DependencyGraph();
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV1(mockGraph);
        const assistantMessage = { role: "assistant", id: "assist456" };
        const nodeId = visualizer["generateNodeId"](assistantMessage);
        expect(nodeId).toBe("A-assist456");
    });

    it("should generate a fallback node ID if message role is unknown and no ID is present", () => {
        const mockGraph = new DependencyGraph();
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV1(mockGraph);
        const unknownMessage = { role: "tool", id: undefined };
        const nodeId = visualizer["generateNodeId"](unknownMessage);
        expect(nodeId).toMatch(/^T-[a-z0-9]{7,9}$/);
    });
});