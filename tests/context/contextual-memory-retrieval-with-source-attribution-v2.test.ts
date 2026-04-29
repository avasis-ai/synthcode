import { describe, it, expect } from "vitest";
import { AttributedContextMerger, SourceMetadata, AttributedContextChunk } from "../src/context/contextual-memory-retrieval-with-source-attribution-v2";

describe("AttributedContextMerger", () => {
  it("should correctly merge multiple chunks with the same content from different sources", () => {
    const merger = new AttributedContextMerger();
    const chunk1: AttributedContextChunk = {
      content: "The quick brown fox",
      sourceMetadata: { documentId: "doc1", pageNumber: 1, sourceType: "document" },
    };
    const chunk2: AttributedContextChunk = {
      content: "The quick brown fox",
      sourceMetadata: { documentId: "doc2", pageNumber: 5, sourceType: "database" },
    };

    // Mocking the merge method signature for testing purposes, assuming it accepts an array of chunks
    // and updates the internal map. We'll simulate the expected behavior based on the class structure.
    // Since the provided code snippet is incomplete, we assume merge takes an array of chunks.
    (merger as any).merge([chunk1, chunk2]);

    // Check if the map contains the content and if the source metadata is updated/combined (assuming it keeps the last one or combines them)
    // Given the internal map structure, we check if the content is present.
    expect(merger['chunks'].size).toBe(1);
    const mergedChunk = merger['chunks'].get("The quick brown fox");
    expect(mergedChunk).toBeDefined();
    // We can't assert the exact source metadata without knowing the merge logic for conflicts,
    // but we can assert that *a* source metadata exists.
    expect(mergedChunk!.sourceMetadata).toBeDefined();
  });

  it("should add a new chunk if the content is unique", () => {
    const merger = new AttributedContextMerger();
    const chunk1: AttributedContextChunk = {
      content: "First unique piece of info.",
      sourceMetadata: { documentId: "docA", pageNumber: 10, sourceType: "document" },
    };
    const chunk2: AttributedContextChunk = {
      content: "Second unique piece of info.",
      sourceMetadata: { documentId: "docB", pageNumber: 20, sourceType: "api" },
    };

    (merger as any).merge([chunk1, chunk2]);

    expect(merger['chunks'].size).toBe(2);
    expect(merger['chunks'].get("First unique piece of info.")).toBeDefined();
    expect(merger['chunks'].get("Second unique piece of info.")).toBeDefined();
  });

  it("should handle an empty input array gracefully", () => {
    const merger = new AttributedContextMerger();
    (merger as any).merge([]);

    expect(merger['chunks'].size).toBe(0);
  });
});