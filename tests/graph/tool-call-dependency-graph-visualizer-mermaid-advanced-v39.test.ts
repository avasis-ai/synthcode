import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV39 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v39";
import { DependencyGraph } from "../src/graph/dependency-graph";
import { ToolCallNode } from "../src/graph/tool-call-node";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV39", () => {
    it("should return a default graph for an empty graph", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV39();
        const emptyGraph = new DependencyGraph();
        const result = visualizer.visualize(emptyGraph);
        expect(result).toContain("graph TD");
        expect(result).toContain("A[\"No nodes found\"]");
    });

    it("should generate a basic graph structure for a simple dependency", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV39();
        const toolCallNode = new ToolCallNode("toolA", "toolA_call");
        const graph = new DependencyGraph([toolCallNode], []);

        const result = visualizer.visualize(graph);
        expect(result).toContain("toolA_call");
        expect(result).toContain("graph TD");
    });

    it("should generate a more complex graph with multiple nodes and edges", () => {
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV39();
        const toolCallNode1 = new ToolCallNode("toolA", "toolA_call");
        const toolCallNode2 = new ToolCallNode("toolB", "toolB_call");
        const graph = new DependencyGraph([toolCallNode1, toolCallNode2], [
            { source: "toolA_call", target: "toolB_call" }
        ]);

        const result = visualizer.visualize(graph);
        expect(result).toContain("toolA_call");
        expect(result).toContain("toolB_call");
        expect(result).toContain("toolA_call --> toolB_call");
    });
});