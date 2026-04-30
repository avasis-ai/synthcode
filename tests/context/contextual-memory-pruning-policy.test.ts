import { describe, it, expect } from "vitest";
import {
  MemoryEntry,
  PruningContext,
  PruningCriteria,
} from "../context/contextual-memory-pruning-policy";

describe("contextualMemoryPruningPolicy", () => {
  it("should prune memory entries exceeding max size based on relevance", async () => {
    const mockMemory: MemoryEntry[] = [
      {
        id: "1",
        timestamp: Date.now() - 10000,
        content: {
          role: "user";
          content: "Initial query about topic A.";
        },
        relevanceScore: 0.9,
        domainImportance: 0.5,
      },
      {
        id: "2",
        timestamp: Date.now() - 5000,
        content: {
          role: "assistant";
          content: "Response about topic A.";
        },
        relevanceScore: 0.8,
        domainImportance: 0.6,
      },
      {
        id: "3",
        timestamp: Date.now() - 1000,
        content: {
          role: "user";
          content: "Follow-up on topic A.";
        },
        relevanceScore: 0.95,
        domainImportance: 0.7,
      },
      {
        id: "4",
        timestamp: Date.now(),
        content: {
          role: "user";
          content: "Irrelevant query about topic Z.";
        },
        relevanceScore: 0.1,
        domainImportance: 0.1,
      },
    ];
    const context: PruningContext = {
      currentMessage: {
        role: "user";
        content: "What is the latest update on topic A?",
      },
      memory: mockMemory,
    };
    const criteria: PruningCriteria = {
      maxMemorySize: 3,
      relevanceWeight: 0.5,
      ageWeight: 0.3,
      domainWeight: 0.2,
      minRelevanceThreshold: 0.2,
    };

    // Mock the function call if it exists, otherwise assume it's exported and callable
    // Assuming the function is named 'pruneMemory' for this test structure
    const prunedMemory = await (window as any).pruneMemory(context, criteria);

    expect(prunedMemory.length).toBeLessThanOrEqual(criteria.maxMemorySize);
    expect(prunedMemory).not.toContainEqual(mockMemory[3]); // Check if the lowest relevance item is pruned
  });

  it("should prioritize pruning based on low relevance score when memory is large", async () => {
    const mockMemory: MemoryEntry[] = [
      {
        id: "1",
        timestamp: Date.now() - 10000,
        content: {
          role: "user";
          content: "Important topic.";
        },
        relevanceScore: 0.9,
        domainImportance: 0.9,
      },
      {
        id: "2",
        timestamp: Date.now() - 5000,
        content: {
          role: "assistant";
          content: "Less important topic.";
        },
        relevanceScore: 0.4,
        domainImportance: 0.4,
      },
      {
        id: "3",
        timestamp: Date.now() - 1000,
        content: {
          role: "user";
          content: "Very important follow-up.";
        },
        relevanceScore: 0.95,
        domainImportance: 0.95,
      },
      {
        id: "4",
        timestamp: Date.now(),
        content: {
          role: "user";
          content: "Totally irrelevant noise.";
        },
        relevanceScore: 0.05,
        domainImportance: 0.1,
      },
      {
        id: "5",
        timestamp: Date.now(),
        content: {
          role: "user";
          content: "Another piece of noise.";
        },
        relevanceScore: 0.1,
        domainImportance: 0.1,
      },
    ];
    const context: PruningContext = {
      currentMessage: {
        role: "user";
        content: "What is the latest update?",
      },
      memory: mockMemory,
    };
    const criteria: PruningCriteria = {
      maxMemorySize: 3,
      relevanceWeight: 0.5,
      ageWeight: 0.3,
      domainWeight: 0.2,
      minRelevanceThreshold: 0.2,
    };

    const prunedMemory = await (window as any).pruneMemory(context, criteria);

    // Expect the two lowest scoring items (4 and 5) to be pruned, keeping 1, 2, 3 (or the top 3)
    expect(prunedMemory.length).toBe(3);
    expect(prunedMemory.map(e => e.id)).toEqual(expect.arrayContaining(["1", "2", "3"]));
  });

  it("should return the original memory if no pruning criteria are met", async () => {
    const mockMemory: MemoryEntry[] = [
      {
        id: "1",
        timestamp: Date.now(),
        content: {
          role: "user";
          content: "Keep this.",
        },
        relevanceScore: 0.9,
        domainImportance: 0.9,
      },
    ];
    const context: PruningContext = {
      currentMessage: {
        role: "user";
        content: "Test.",
      },
      memory: mockMemory,
    };
    const criteria: PruningCriteria = {
      maxMemorySize: 5, // Larger than current size
      relevanceWeight: 0.5,
      ageWeight: 0.3,
      domainWeight: 0.2,
      minRelevanceThreshold: 0.0, // Very low threshold
    };

    const prunedMemory = await (window as any).pruneMemory(context, criteria);

    expect(prunedMemory).toEqual(mockMemory);
    expect(prunedMemory.length).toBe(1);
  });
});