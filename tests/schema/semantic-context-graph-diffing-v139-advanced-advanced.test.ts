import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffer } from "../src/schema/semantic-context-graph-diffing-v139-advanced-advanced";
import { Graph, Node, Edge } from "../src/schema/graph-types";

describe("SemanticContextGraphDiffer", () => {
    it("should calculate a low score when graphs are identical", () => {
        const mockDistance: (nodeA: Node, nodeB: Node) => number = () => 0;
        const differ = new SemanticContextGraphDiffer(mockDistance);

        const graph1: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
                { id: "n2", type: "B", embedding: [0.3, 0.4] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.0 },
            ],
        };
        const graph2: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
                { id: "n2", type: "B", embedding: [0.3, 0.4] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.0 },
            ],
        };

        const score = differ.calculateGraphDifferenceScore(graph1, graph2);
        expect(score).toBeCloseTo(0.0);
    });

    it("should calculate a higher score when there are missing nodes", () => {
        const mockDistance: (nodeA: Node, nodeB: Node) => number = (nodeA, nodeB) => {
            return nodeA.id === nodeB.id ? 0 : 1.0;
        };
        const differ = new SemanticContextGraphDiffer(mockDistance, 0.5);

        const graph1: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
                { id: "n2", type: "B", embedding: [0.3, 0.4] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.0 },
            ],
        };
        const graph2: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.0 }, // Edge referencing missing node n2
            ],
        };

        const score = differ.calculateGraphDifferenceScore(graph1, graph2);
        // Expect a non-zero score due to missing node n2 in graph2
        expect(score).toBeGreaterThan(0.1);
    });

    it("should calculate a higher score when there are differing edge weights", () => {
        const mockDistance: (nodeA: Node, nodeB: Node) => number = () => 0;
        const differ = new SemanticContextGraphDiffer(mockDistance, 0.5);

        const graph1: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
                { id: "n2", type: "B", embedding: [0.3, 0.4] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.0 },
            ],
        };
        const graph2: Graph = {
            nodes: [
                { id: "n1", type: "A", embedding: [0.1, 0.2] },
                { id: "n2", type: "B", embedding: [0.3, 0.4] },
            ],
            edges: [
                { source: "n1", target: "n2", weight: 1.5 }, // Different weight
            ],
        };

        const score = differ.calculateGraphDifferenceScore(graph1, graph2);
        // Expect a score influenced by the edge weight difference
        expect(score).toBeGreaterThan(0.0);
    });
});