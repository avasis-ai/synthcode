import { describe, it, expect } from "vitest";
import { SemanticContextMergerV5 } from "../src/context/semantic-context-merger-v5";
import { ContextChunk, Query, TimeWindow } from "../src/context/context-types";

describe("SemanticContextMergerV5", () => {
    const merger = new SemanticContextMergerV5();

    it("should calculate a combined score for a single chunk based on query and time window", () => {
        const mockChunk: ContextChunk = { content: "Relevant info", source: "doc1", relevanceScore: 0.8 };
        const mockQuery: Query = { queryText: "What is the key concept?" };
        const mockTimeWindow: TimeWindow = { startTime: 1600000000, endTime: 1610000000 };

        // Assuming the implementation calculates a score based on some combination of inputs
        const score = merger.calculateCombinedScore(mockChunk, mockQuery, mockTimeWindow);
        expect(typeof score).toBe("number");
        // Basic check to ensure it returns a number, actual value depends on implementation details
        expect(score).toBeGreaterThanOrEqual(0);
    });

    it("should merge an array of context chunks, prioritizing relevance and temporal proximity", () => {
        const mockQuery: Query = { queryText: "Recent events" };
        const mockTimeWindow: TimeWindow = { startTime: 1620000000, endTime: 1630000000 };
        const chunk1: ContextChunk = { content: "Old data", source: "docA", relevanceScore: 0.5 };
        const chunk2: ContextChunk = { content: "Recent breakthrough", source: "docB", relevanceScore: 0.9 };
        const chunk3: ContextChunk = { content: "Irrelevant noise", source: "docC", relevanceScore: 0.2 };

        const chunks: ContextChunk[] = [chunk1, chunk2, chunk3];

        const mergedChunks = merger.mergeWithTemporalScoring(chunks, mockQuery, mockTimeWindow);

        expect(mergedChunks.length).toBeGreaterThanOrEqual(1);
        // Check if the most relevant/recent chunk is likely to be present or prioritized
        const hasHighRelevanceChunk = mergedChunks.some(c => c.relevanceScore >= 0.8);
        expect(hasHighRelevanceChunk).toBe(true);
    });

    it("should return an empty array if no context chunks are provided for merging", () => {
        const mockQuery: Query = { queryText: "Test" };
        const mockTimeWindow: TimeWindow = { startTime: 0, endTime: 1 };
        const emptyChunks: ContextChunk[] = [];

        const mergedChunks = merger.mergeWithTemporalScoring(emptyChunks, mockQuery, mockTimeWindow);

        expect(mergedChunks).toEqual([]);
    });
});