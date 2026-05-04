import { describe, it, expect } from "vitest";
import { ContextualSnapshotMerger, MergeStrategy } from "../src/state/contextual-snapshot-merger";

describe("ContextualSnapshotMerger", () => {
  it("should merge snapshots using 'latest' strategy correctly", () => {
    const snapshots: any[] = [
      { data: { a: 1, b: "old" }, timestamp: 100, source: "A" },
      { data: { b: "newer", c: 3 }, timestamp: 200, source: "B" },
    ];
    const merger = new ContextualSnapshotMerger(snapshots);
    const result = merger.merge("latest");
    expect(result).toEqual({ a: 1, b: "newer", c: 3 });
  });

  it("should merge snapshots using 'conflict-resolution-by-source' strategy", () => {
    const snapshots: any[] = [
      { data: { key: "valueA" }, timestamp: 100, source: "SourceA" },
      { data: { key: "valueB" }, timestamp: 200, source: "SourceB" },
      { data: { key: "valueC" }, timestamp: 300, source: "SourceC" },
    ];
    const merger = new ContextualSnapshotMerger(snapshots);
    const result = merger.merge("conflict-resolution-by-source");
    // Assuming the implementation prioritizes the last source encountered for conflicts
    expect(result).toEqual({ key: "valueC" });
  });

  it("should handle empty snapshots array gracefully", () => {
    const snapshots: any[] = [];
    const merger = new ContextualSnapshotMerger(snapshots);
    const result = merger.merge("latest");
    expect(result).toEqual({});
  });
});