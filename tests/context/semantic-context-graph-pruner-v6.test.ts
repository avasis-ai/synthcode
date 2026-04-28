import { describe, it, expect } from "vitest";
import { SemanticContextGraphPrunerV6 } from "../src/context/semantic-context-graph-pruner-v6";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("SemanticContextGraphPrunerV6", () => {
    it("should prune nodes and edges correctly when the target size is large enough", () => {
        const node1: GraphNode = { id: "n1", message: { role: "user", content: "Hi" }, contentBlocks: [new TextBlock("Hi")] };
        const node2: GraphNode = { id: "n2", message: { role: "assistant", content: "Hello" }, contentBlocks: [new TextBlock("Hello")] };
        const node3: GraphNode = { id: "n3", message: { role: "user", content: "How are you?" }, contentBlocks: [new TextBlock("How are you?")], };
        const nodes: GraphNode[] = [node1, node2, node3];
        const edges: GraphEdge[] = [
            { sourceId: "n1", targetId: "n2", weight: 0.8 },
            { sourceId: "n2", targetId: "n3", weight: 0.9 },
        ];
        const pruner = new SemanticContextGraphPrunerV6(nodes, edges, 5);

        const prunedNodes = pruner.getNodes();
        const prunedEdges = pruner.getEdges();

        expect(prunedNodes.length).toBe(3);
        expect(prunedEdges.length).toBe(2);
    });

    it("should prune nodes and edges when the target size is small", () => {
        const node1: GraphNode = { id: "n1", message: { role: "user", content: "Hi" }, contentBlocks: [new TextBlock("Hi")] };
        const node2: GraphNode = { id: "n2", message: { role: "assistant", content: "Hello" }, contentBlocks: [new TextBlock("Hello")] };
        const node3: GraphNode = { id: "n3", message: { role: "user", content: "How are you?" }, contentBlocks: [new TextBlock("How are you?")], };
        const nodes: GraphNode[] = [node1, node2, node3];
        const edges: GraphEdge[] = [
            { sourceId: "n1", targetId: "n2", weight: 0.8 },
            { sourceId: "n2", targetId: "n3", weight: 0.9 },
        ];
        const pruner = new SemanticContextGraphPrunerV6(nodes, edges, 1);

        const prunedNodes = pruner.getNodes();
        const prunedEdges = pruner.getEdges();

        expect(prunedNodes.length).toBe(1);
        expect(prunedEdges.length).toBe(0);
    });

    it("should handle empty input graphs gracefully", () => {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const pruner = new SemanticContextGraphPrunerV6(nodes, edges, 3);

        const prunedNodes = pruner.getNodes();
        const prunedEdges = pruner.getEdges();

        expect(prunedNodes.length).toBe(0);
        expect(prunedEdges.length).toBe(0);
    });
});