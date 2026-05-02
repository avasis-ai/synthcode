import { describe, it, expect } from "vitest";
import { ContextualHistoryPruner, ContextChunk, RelevanceScorer } from "../src/context/contextual-history-pruner";

const mockScorer: RelevanceScorer = {
    score: (query: string, chunk: ContextChunk): number => {
        // Mock implementation for testing purposes
        if (chunk.metadata.topic === "important") return 0.9;
        return 0.1;
    },
};

describe("ContextualHistoryPruner", () => {
    it("should prune history when the number of chunks exceeds maxChunks", () => {
        const maxChunks = 3;
        const pruner = new ContextualHistoryPruner(mockScorer, maxChunks);

        const history: ContextChunk[] = [
            { content: "c1", metadata: { source: "a", timestamp: 1, topic: "topic1" } },
            { content: "c2", metadata: { source: "b", timestamp: 2, topic: "topic2" } },
            { content: "c3", metadata: { source: "c", timestamp: 3, topic: "important" } },
            { content: "c4", metadata: { source: "d", timestamp: 4, topic: "topic3" } },
        ];

        const prunedHistory = pruner.prune(history, "test query");

        expect(prunedHistory.length).toBe(maxChunks);
        // Check if the first chunk is removed (assuming pruning keeps the most relevant/recent)
        expect(prunedHistory[0].content).toBe("c2"); // Based on typical pruning logic (keeping the most relevant/recent)
    });

    it("should not prune history if the number of chunks is less than or equal to maxChunks", () => {
        const maxChunks = 5;
        const pruner = new ContextualHistoryPruner(mockScorer, maxChunks);

        const history: ContextChunk[] = [
            { content: "c1", metadata: { source: "a", timestamp: 1, topic: "topic1" } },
            { content: "c2", metadata: { source: "b", timestamp: 2, topic: "topic2" } },
        ];

        const prunedHistory = pruner.prune(history, "test query");

        expect(prunedHistory.length).toBe(2);
        expect(prunedHistory).toEqual(history);
    });

    it("should prioritize keeping chunks with higher relevance scores", () => {
        const maxChunks = 2;
        const pruner = new ContextualHistoryPruner(mockScorer, maxChunks);

        const history: ContextChunk[] = [
            { content: "low", metadata: { source: "a", timestamp: 1, topic: "unimportant" } },
            { content: "high1", metadata: { source: "b", timestamp: 2, topic: "important" } },
            { content: "low2", metadata: { source: "c", timestamp: 3, topic: "unimportant" } },
            { content: "high2", metadata: { source: "d", timestamp: 4, topic: "important" } },
        ];

        const prunedHistory = pruner.prune(history, "test query");

        expect(prunedHistory.length).toBe(maxChunks);
        // Expecting the two chunks with score 0.9 to be kept
        expect(prunedHistory.some(c => c.content === "high1")).toBe(true);
        expect(prunedHistory.some(c => c.content === "high2")).toBe(true);
    });
});