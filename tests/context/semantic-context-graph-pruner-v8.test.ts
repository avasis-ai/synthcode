import { describe, it, expect } from "vitest";
import { SemanticContextGraphPrunerV8 } from "../src/context/semantic-context-graph-pruner-v8";
import { GraphNode, GraphEdge, PruningReport } from "../src/context/semantic-context-graph-pruner-v8.types";

describe("SemanticContextGraphPrunerV8", () => {
    it("should prune nodes and edges based on similarity thresholds correctly", async () => {
        const pruner = new SemanticContextGraphPrunerV8(0.7);
        const initialNodes: Map<string, GraphNode> = new Map([
            ["nodeA", { id: "nodeA", content: [{ type: "text", text: "apple" }], neighbors: new Set(["nodeB"]), similarityScore: 0.9 }],
            ["nodeB", { id: "nodeB", content: [{ type: "text", text: "apple pie" }], neighbors: new Set(["nodeA", "nodeC"]), similarityScore: 0.8 }],
            ["nodeC", { id: "nodeC", content: [{ type: "text", text: "banana" }], neighbors: new Set(["nodeB"]), similarityScore: 0.3 }],
        ]);
        const initialEdges: GraphEdge[] = [
            { source: "nodeA", target: "nodeB", weight: 0.9 },
            { source: "nodeB", target: "nodeC", weight: 0.3 },
        ];

        const report: PruningReport = await pruner.pruneGraph(initialNodes, initialEdges);

        expect(report.removedNodes).toContain("nodeC");
        expect(report.removedEdges.length).toBe(1);
        expect(report.retainedGraph.size).toBe(2);
    });

    it("should retain all nodes and edges if similarity scores are high enough", async () => {
        const pruner = new SemanticContextGraphPrunerV8(0.1);
        const initialNodes: Map<string, GraphNode> = new Map([
            ["nodeX", { id: "nodeX", content: [{ type: "text", text: "hello" }], neighbors: new Set(["nodeY"]), similarityScore: 0.95 }],
            ["nodeY", { id: "nodeY", content: [{ type: "text", text: "hello world" }], neighbors: new Set(["nodeX"]), similarityScore: 0.92 }],
        ]);
        const initialEdges: GraphEdge[] = [
            { source: "nodeX", target: "nodeY", weight: 0.95 },
            { source: "nodeY", target: "nodeX", weight: 0.95 },
        ];

        const report: PruningReport = await pruner.pruneGraph(initialNodes, initialEdges);

        expect(report.removedNodes).toEqual([]);
        expect(report.removedEdges).toEqual([]);
        expect(report.retainedGraph.size).toBe(2);
    });

    it("should handle an empty graph gracefully", async () => {
        const pruner = new SemanticContextGraphPrunerV8(0.5);
        const initialNodes: Map<string, GraphNode> = new Map<string, GraphNode>();
        const initialEdges: GraphEdge[] = [];

        const report: PruningReport = await pruner.pruneGraph(initialNodes, initialEdges);

        expect(report.removedNodes).toEqual([]);
        expect(report.removedEdges).toEqual([]);
        expect(report.retainedGraph.size).toBe(0);
    });
});