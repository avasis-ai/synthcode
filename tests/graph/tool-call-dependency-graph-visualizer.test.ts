import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer";
import { DependencyGraph } from "../src/graph/dependency-graph";
import { Message } from "../src/types";

describe("ToolCallDependencyGraphVisualizer", () => {
    it("should correctly collect nodes and edges from a simple graph", () => {
        const mockGraph = {
            nodes: {
                "node1": { id: "node1", type: "message", content: "Initial message" },
                "node2": { id: "node2", type: "tool_call", content: "Tool A call" },
                "node3": { id: "node3", type: "text", content: "Response text" },
            },
            edges: [
                { from: "node1", to: "node2", label: "calls", type: "call" },
                { from: "node2", to: "node3", label: "results in", type: "result" },
            ],
        } as unknown as DependencyGraph; // Type assertion for mocking simplicity

        const visualizer = new ToolCallDependencyGraphVisualizer(mockGraph);
        const { nodes, edges } = (visualizer as any).collectNodesAndEdges();

        expect(nodes).toHaveProperty("node1");
        expect(nodes).toHaveProperty("node2");
        expect(nodes).toHaveProperty("node3");
        expect(edges).toHaveLength(2);
        expect(edges[0].from).toBe("node1");
        expect(edges[0].to).toBe("node2");
    });

    it("should handle a graph with no edges", () => {
        const mockGraph = {
            nodes: {
                "node1": { id: "node1", type: "message", content: "Standalone message" },
            },
            edges: [],
        } as unknown as DependencyGraph;

        const visualizer = new ToolCallDependencyGraphVisualizer(mockGraph);
        const { nodes, edges } = (visualizer as any).collectNodesAndEdges();

        expect(nodes).toHaveProperty("node1");
        expect(edges).toEqual([]);
    });

    it("should correctly identify node types and relationships", () => {
        const mockGraph = {
            nodes: {
                "start": { id: "start", type: "message", content: "Start" },
                "tool_call": { id: "tool_call", type: "tool_use", content: "Tool call" },
                "final_text": { id: "final_text", type: "text", content: "Final answer" },
            },
            edges: [
                { from: "start", to: "tool_call", label: "triggers", type: "trigger" },
                { from: "tool_call", to: "final_text", label: "provides", type: "result" },
            ],
        } as unknown as DependencyGraph;

        const visualizer = new ToolCallDependencyGraphVisualizer(mockGraph);
        const { nodes, edges } = (visualizer as any).collectNodesAndEdges();

        expect(nodes["tool_call"].type).toBe("tool_use");
        expect(edges[0].label).toBe("triggers");
        expect(edges[1].type).toBe("result");
    });
});