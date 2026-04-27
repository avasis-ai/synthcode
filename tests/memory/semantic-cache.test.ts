import { describe, it, expect } from "vitest";
import { SemanticCache } from "../src/memory/semantic-cache";

describe("SemanticCache", () => {
  it("should initialize with an empty cache", () => {
    const cache = new SemanticCache();
    expect(cache.getCacheSize()).toBe(0);
  });

  it("should add and retrieve a semantic embedding correctly", async () => {
    const cache = new SemanticCache();
    const embedding = [0.1, 0.2, 0.3];
    await cache.addEmbedding("query", embedding);
    const retrieved = await cache.getEmbedding("query");
    expect(retrieved).toEqual(embedding);
  });

  it("should handle multiple entries and retrieve the correct one", async () => {
    const cache = new SemanticCache();
    await cache.addEmbedding("query1", [0.1, 0.1]);
    await cache.addEmbedding("query2", [0.2, 0.2]);
    const retrieved1 = await cache.getEmbedding("query1");
    const retrieved2 = await cache.getEmbedding("query2");
    expect(retrieved1).toEqual([0.1, 0.1]);
    expect(retrieved2).toEqual([0.2, 0.2]);
  });
});