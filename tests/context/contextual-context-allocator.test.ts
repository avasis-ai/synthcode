import { describe, it, expect } from "vitest";
import { ContextualContextAllocator } from "../src/context/contextual-context-allocator";

describe("ContextualContextAllocator", () => {
    it("should prioritize sources based on relevance and impact scores", () => {
        const allocator = new ContextualContextAllocator();
        const budget = { maxTokens: 1000, maxTimeMs: 5000 };

        const sourceA = { id: "A", relevanceScore: 0.9, impactScore: 0.8, getCost: () => 10 };
        const sourceB = { id: "B", relevanceScore: 0.5, impactScore: 0.9, getCost: () => 5 };
        const sourceC = { id: "C", relevanceScore: 0.7, impactScore: 0.7, getCost: () => 8 };

        const sources = [sourceA, sourceB, sourceC];
        const allocated = allocator.allocate(sources, budget);

        // Expect A (highest relevance) and B (high impact) to be prioritized over C
        expect(allocated.allocatedSources).toHaveLength(3);
        expect(allocated.allocatedSources.includes("A")).toBe(true);
        expect(allocated.allocatedSources.includes("B")).toBe(true);
    });

    it("should handle budget constraints and select the best fit sources", () => {
        const allocator = new ContextualContextAllocator();
        const budget = { maxTokens: 15, maxTimeMs: 1000 };

        // Source A: Cost 10 tokens
        const sourceA = { id: "A", relevanceScore: 0.9, impactScore: 0.9, getCost: () => 10 };
        // Source B: Cost 8 tokens
        const sourceB = { id: "B", relevanceScore: 0.8, impactScore: 0.7, getCost: () => 8 };
        // Source C: Cost 5 tokens
        const sourceC = { id: "C", relevanceScore: 0.6, impactScore: 0.6, getCost: () => 5 };

        // Budget only allows for sources A and C (10 + 5 = 15)
        const sources = [sourceA, sourceB, sourceC];
        const allocated = allocator.allocate(sources, budget);

        // Expect B to be excluded due to budget overflow (10 + 8 > 15, 5 + 8 > 15)
        expect(allocated.allocatedSources).toHaveLength(2);
        expect(allocated.allocatedSources).toContain("A");
        expect(allocated.allocatedSources).toContain("C");
    });

    it("should return no sources if the budget is insufficient for any source", () => {
        const allocator = new ContextualContextAllocator();
        const budget = { maxTokens: 1, maxTimeMs: 100 };

        // Source A: Cost 10 tokens
        const sourceA = { id: "A", relevanceScore: 0.9, impactScore: 0.9, getCost: () => 10 };
        const sourceB = { id: "B", relevanceScore: 0.8, impactScore: 0.7, getCost: () => 8 };

        const sources = [sourceA, sourceB];
        const allocated = allocator.allocate(sources, budget);

        expect(allocated.allocatedSources).toHaveLength(0);
        expect(allocated.totalCost).toBe(0);
    });
});