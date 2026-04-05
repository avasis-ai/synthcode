import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV116 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v116";
import { GraphContext, GraphNode, GraphEdge, Message } from "../src/graph/graph-types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV116", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV116();

    it("should return a basic graph structure when no nodes are present", () => {
        const mockGraph: GraphContext = { nodes: [], edges: [] };
        const mockContext: { message: Message } = { message: { content: "Test message" } };

        const result = visualizer.render(mockGraph, mockContext);
        expect(result).toContain("graph TD; A[No nodes available]");
    });

    it("should generate a basic graph structure with nodes and edges", () => {
        const mockNodes: GraphNode[] = [
            { id: "A", type: "tool_call", name: "ToolA", description: "Description A" },
            { id: "B", type: "message", name: "User Input", description: "User input" },
        ];
        const mockEdges: GraphEdge[] = [
            { source: "B", target: "A", type: "calls" },
        ];
        const mockGraph: GraphContext = { nodes: mockNodes, edges: mockEdges };
        const mockContext: { message: Message } = { message: { content: "Test message" } };

        const result = visualizer.render(mockGraph, mockContext);
        expect(result).toContain("graph TD;");
        expect(result).toContain("A[\"ToolA\"]");
        expect(result).toContain("B[\"User Input\"]");
        expect(result).toContain("B --> A");
    });

    it("should handle multiple nodes and edges correctly", () => {
        const mockNodes: GraphNode[] = [
            { id: "Start", type: "message", name: "Start", description: "Start node" },
            { id: "Tool1", type: "tool_call", name: "Tool1", description: "Tool 1" },
            { id: "Tool2", type: "tool_call", name: "Tool2", description: "Tool 2" },
        ];
        const mockEdges: GraphEdge[] = [
            { source: "Start", target: "Tool1", type: "calls" },
            { source: "Tool1", target: "Tool2", type: "calls" },
        ];
        const mockGraph: GraphContext = { nodes: mockNodes, edges: mockEdges };
        const mockContext: { message: Message } = { message: { content: "Test message" } };

        const result = visualizer.render(mockGraph, mockContext);
        expect(result).toContain("Start[\"Start\"]");
        expect(result).toContain("Tool1[\"Tool1\"]");
        expect(result).toContain("Tool2[\"Tool2\"]");
        expect(result).toContain("Start --> Tool1");
        expect(result).toContain("Tool1 --> Tool2");
    });
});