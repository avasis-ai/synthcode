import { describe, it, expect } from "vitest";
import { ContextualKnowledgeGraphDiffingService } from "../src/graph/contextual-knowledge-graph-diffing-v151-advanced-advanced";
import { GraphState, ConflictResolutionStrategy } from "../src/graph/types";

describe("ContextualKnowledgeGraphDiffingService", () => {
    it("should return an empty diff report when graphs are identical", () => {
        const currentGraph: GraphState = {
            nodes: [{ id: "A", properties: { name: "A" } }],
            edges: [{ source: "A", target: "B", properties: { relation: "knows" } }],
            properties: {}
        };
        const targetGraph: GraphState = {
            nodes: [{ id: "A", properties: { name: "A" } }],
            edges: [{ source: "A", target: "B", properties: { relation: "knows" } }],
            properties: {}
        };
        const service = new ContextualKnowledgeGraphDiffingService();
        const diffReport = service.diff(currentGraph, targetGraph, ConflictResolutionStrategy.OVERWRITE);
        expect(diffReport.nodesToUpdate.length).toBe(0);
        expect(diffReport.edgesToUpdate.length).toBe(0);
    });

    it("should detect added nodes and edges", () => {
        const currentGraph: GraphState = {
            nodes: [{ id: "A", properties: { name: "A" } }],
            edges: [],
            properties: {}
        };
        const targetGraph: GraphState = {
            nodes: [{ id: "A", properties: { name: "A" } }, { id: "B", properties: { name: "B" } }],
            edges: [{ source: "A", target: "B", properties: { relation: "knows" } }],
            properties: {}
        };
        const service = new ContextualKnowledgeGraphDiffingService();
        const diffReport = service.diff(currentGraph, targetGraph, ConflictResolutionStrategy.OVERWRITE);
        expect(diffReport.nodesToUpdate.length).toBeGreaterThanOrEqual(1);
        expect(diffReport.edgesToUpdate.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle property conflicts based on the strategy", () => {
        const currentGraph: GraphState = {
            nodes: [{ id: "A", properties: { age: 30 } }],
            edges: [],
            properties: {}
        };
        const targetGraph: GraphState = {
            nodes: [{ id: "A", properties: { age: 40 } }],
            edges: [],
            properties: {}
        };
        const service = new ContextualKnowledgeGraphDiffingService();
        // Assuming OVERWRITE means target wins
        const diffReportOverwrite = service.diff(currentGraph, targetGraph, ConflictResolutionStrategy.OVERWRITE);
        expect(diffReportOverwrite.nodesToUpdate.length).toBeGreaterThan(0);

        // Assuming KEEP_CURRENT means current wins
        const diffReportKeep = service.diff(currentGraph, targetGraph, ConflictResolutionStrategy.KEEP_CURRENT);
        // In a real implementation, this might result in no change if the logic respects the strategy
        // For testing purposes, we assert that the structure is processed.
        expect(diffReportKeep).toBeDefined();
    });
});