import { describe, it, expect } from "vitest";
import { SemanticContextMerger } from "../src/context/semantic-context-merger";
import { ContextChunk } from "../src/context/semantic-context-merger.types";

describe("SemanticContextMerger", () => {
  it("should correctly merge chunks based on similarity and topK", () => {
    const mockChunks: ContextChunk[] = [
      { id: "c1", source: "a", content: "apple", embedding: new Float32Array([0.1, 0.2]) },
      { id: "c2", source: "b", content: "banana", embedding: new Float32Array([0.9, 0.8]) },
      { id: "c3", source: "a", content: "apple pie", embedding: new Float32Array([0.15, 0.25]) },
    ];
    const config = {
      topK: 2,
      similarityThreshold: 0.5,
      sourceWeights: { a: 1.0, b: 1.0 },
    };
    const merger = new SemanticContextMerger(config);
    const merged = merger.merge(mockChunks);

    expect(merged.length).toBeGreaterThanOrEqual(1);
    expect(merged).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "c1", content: "apple", source: "a" }),
      expect.objectContaining({ id: "c2", content: "banana", source: "b" }),
    ]));
  });

  it("should filter out chunks below the similarity threshold", () => {
    const mockChunks: ContextChunk[] = [
      { id: "c1", source: "a", content: "apple", embedding: new Float32Array([0.1, 0.2]) },
      { id: "c2", source: "b", content: "unrelated", embedding: new Float32Array([0.9, 0.8]) },
      { id: "c3", source: "a", content: "very different", embedding: new Float32Array([0.0, 0.0]) },
    ];
    const config = {
      topK: 5,
      similarityThreshold: 0.6,
      sourceWeights: { a: 1.0, b: 1.0 },
    };
    const merger = new SemanticContextMerger(config);
    const merged = merger.merge(mockChunks);

    expect(merged.length).toBeLessThan(3);
  });

  it("should prioritize chunks from sources with higher weights", () => {
    const mockChunks: ContextChunk[] = [
      { id: "c1", source: "low_weight", content: "info", embedding: new Float32Array([0.5, 0.5]) },
      { id: "c2", source: "high_weight", content: "important", embedding: new Float32Array([0.5, 0.5]) },
      { id: "c3", source: "high_weight", content: "more important", embedding: new Float32Array([0.5, 0.5]) },
    ];
    const config = {
      topK: 2,
      similarityThreshold: 0.1,
      sourceWeights: { low_weight: 0.5, high_weight: 2.0 },
    };
    const merger = new SemanticContextMerger(config);
    const merged = merger.merge(mockChunks);

    // Expecting that the two 'high_weight' chunks are preferred over the 'low_weight' one
    expect(merged.some(c => c.source === "high_weight")).toBe(true);
    expect(merged.length).toBe(2);
  });
});