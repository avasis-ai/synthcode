import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffer } from "../src/graph/semantic-context-graph-diffing-v140-advanced-advanced";
import { GraphPayload, ComparisonRules, DiffReport, GraphNode, GraphEdge } from "../src/graph/types";

describe("SemanticContextGraphDiffer", () => {
    it("should correctly compare two identical graphs", () => {
        const mockSimilarity: (a: any, b: any) => number = () => 1.0;
        const differ = new SemanticContextGraphDiffer(mockSimilarity);

        const graphA: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Alice" } }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n1", type: "KNOWS", properties: {} }
            ]
        };
        const graphB: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Alice" } }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n1", type: "KNOWS", properties: {} }
            ]
        };
        const rules: ComparisonRules = {
            nodeComparison: { required: true, similarityThreshold: 0.9 },
            edgeComparison: { required: true, similarityThreshold: 0.9 }
        };

        const report = differ.compareGraphs(graphA, graphB, rules);
        expect(report.isDifferent).toBe(false);
        expect(report.differences.nodes).toHaveLength(0);
        expect(report.differences.edges).toHaveLength(0);
    });

    it("should detect differences in node properties when similarity is low", () => {
        const mockSimilarity: (a: any, b: any) => number = (a: any, b: any) => 0.5; // Low similarity
        const differ = new SemanticContextGraphDiffer(mockSimilarity);

        const graphA: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Alice" } }
            ],
            edges: []
        };
        const graphB: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Bob" } } // Different name
            ],
            edges: []
        };
        const rules: ComparisonRules = {
            nodeComparison: { required: true, similarityThreshold: 0.8 }, // Threshold higher than similarity
            edgeComparison: { required: false, similarityThreshold: 0.0 }
        };

        const report = differ.compareGraphs(graphA, graphB, rules);
        expect(report.isDifferent).toBe(true);
        expect(report.differences.nodes).toHaveLength(1);
        expect(report.differences.nodes[0].id).toBe("n1");
    });

    it("should detect missing edges between graphs", () => {
        const mockSimilarity: (a: any, b: any) => number = () => 1.0;
        const differ = new SemanticContextGraphDiffer(mockSimilarity);

        const graphA: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Alice" } }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n1", type: "KNOWS", properties: {} }
            ]
        };
        const graphB: GraphPayload = {
            nodes: [
                { id: "n1", type: "User", properties: { name: "Alice" } }
            ],
            edges: [] // Missing edge e1
        };
        const rules: ComparisonRules = {
            nodeComparison: { required: true, similarityThreshold: 0.9 },
            edgeComparison: { required: true, similarityThreshold: 0.9 }
        };

        const report = differ.compareGraphs(graphA, graphB, rules);
        expect(report.isDifferent).toBe(true);
        expect(report.differences.edges).toHaveLength(1);
        expect(report.differences.edges[0].id).toBe("e1");
    });
});