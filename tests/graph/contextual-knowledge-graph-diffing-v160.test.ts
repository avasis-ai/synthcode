import { describe, it, expect } from "vitest";
import { ContextualKnowledgeGraphDiffer } from "../src/graph/contextual-knowledge-graph-diffing-v160";
import { GraphState, Context } from "../src/graph/types";

describe("ContextualKnowledgeGraphDiffer", () => {
    it("should correctly diff nodes when nodes are added, removed, and modified", () => {
        const context: Context = { source: "test" };
        const differ = new ContextualKnowledgeGraphDiffer(context);

        const graphA: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Alice" } },
                { id: "n2", type: "Concept", properties: { name: "Math" } },
            ],
            edges: []
        };

        const graphB: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Alice Updated" } }, // Modified
                { id: "n2", type: "Concept", properties: { name: "Math" } },
                { id: "n3", type: "Location", properties: { name: "Paris" } }, // Added
            ],
            edges: []
        };

        const diffReport = differ.diff(graphA, graphB);

        expect(diffReport.nodeChanges.added).toHaveLength(1);
        expect(diffReport.nodeChanges.removed).toHaveLength(0);
        expect(diffReport.nodeChanges.modified).toHaveLength(1);
        expect(diffReport.nodeChanges.modified).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "n1", changes: { properties: { name: "Alice Updated" } } })
            ])
        );
    });

    it("should correctly diff edges considering node changes", () => {
        const context: Context = { source: "test" };
        const differ = new ContextualKnowledgeGraphDiffer(context);

        const graphA: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Alice" } },
                { id: "n2", type: "Concept", properties: { name: "Math" } },
            ],
            edges: [
                { id: "e1", source: "n1", target: "n2", type: "KNOWS" }
            ]
        };

        const graphB: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Alice" } },
                { id: "n2", type: "Concept", properties: { name: "Math" } },
            ],
            edges: [
                { id: "e1", source: "n1", target: "n2", type: "KNOWS", properties: { strength: 0.9 } } // Modified
            ]
        };

        const diffReport = differ.diff(graphA, graphB);

        expect(diffReport.edgeChanges.added).toHaveLength(0);
        expect(diffReport.edgeChanges.removed).toHaveLength(0);
        expect(diffReport.edgeChanges.modified).toHaveLength(1);
        expect(diffReport.edgeChanges.modified).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "e1", changes: { properties: { strength: 0.9 } } })
            ])
        );
    });

    it("should report no changes when graphA and graphB are identical", () => {
        const context: Context = { source: "test" };
        const differ = new ContextualKnowledgeGraphDiffer(context);

        const graphA: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Bob" } }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n1", type: "SELF" }
            ]
        };

        const graphB: GraphState = {
            nodes: [
                { id: "n1", type: "Person", properties: { name: "Bob" } }
            ],
            edges: [
                { id: "e1", source: "n1", target: "n1", type: "SELF" }
            ]
        };

        const diffReport = differ.diff(graphA, graphB);

        expect(diffReport.nodeChanges.added).toHaveLength(0);
        expect(diffReport.nodeChanges.removed).toHaveLength(0);
        expect(diffReport.nodeChanges.modified).toHaveLength(0);
        expect(diffReport.edgeChanges.added).toHaveLength(0);
        expect(diffReport.edgeChanges.removed).toHaveLength(0);
        expect(diffReport.edgeChanges.modified).toHaveLength(0);
    });
});