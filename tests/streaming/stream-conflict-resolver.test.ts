import { describe, it, expect } from "vitest";
import { StreamConflictResolver, StreamUpdate, StreamSource } from "../src/streaming/stream-conflict-resolver";

describe("StreamConflictResolver", () => {
  it("should resolve conflicts using the latest timestamp when multiple sources update the same resource", async () => {
    const resolver = new StreamConflictResolver();
    const resourceId = "resource-1";

    const updates: StreamUpdate[] = [
      {
        resourceId: resourceId,
        source: { name: "SourceA", authorityLevel: 1 },
        timestamp: 1678886400,
        payload: { value: "A", count: 1 },
      },
      {
        resourceId: resourceId,
        source: { name: "SourceB", authorityLevel: 2 },
        timestamp: 1678886500,
        payload: { value: "B", count: 2 },
      },
      {
        resourceId: resourceId,
        source: { name: "SourceC", authorityLevel: 3 },
        timestamp: 1678886300,
        payload: { value: "C", count: 3 },
      },
    ];

    const resolved = await resolver.resolveConflicts(updates);

    expect(resolved).toEqual({
      value: "B",
      count: 2,
    });
  });

  it("should handle multiple resources with different conflicts independently", async () => {
    const resolver = new StreamConflictResolver();
    const updates: StreamUpdate[] = [
      {
        resourceId: "resource-A",
        source: { name: "SourceA", authorityLevel: 1 },
        timestamp: 100,
        payload: { data: "A1" },
      },
      {
        resourceId: "resource-B",
        source: { name: "SourceB", authorityLevel: 2 },
        timestamp: 200,
        payload: { data: "B1" },
      },
      {
        resourceId: "resource-A",
        source: { name: "SourceC", authorityLevel: 3 },
        timestamp: 150,
        payload: { data: "A2" },
      },
      {
        resourceId: "resource-B",
        source: { name: "SourceD", authorityLevel: 4 },
        timestamp: 250,
        payload: { data: "B2" },
      },
    ];

    const resolved = await resolver.resolveConflicts(updates);

    expect(resolved).toEqual({
      "resource-A": {
        data: "A2",
      },
      "resource-B": {
        data: "B2",
      },
    });
  });

  it("should return an empty object if no updates are provided", async () => {
    const resolver = new StreamConflictResolver();
    const updates: StreamUpdate[] = [];

    const resolved = await resolver.resolveConflicts(updates);

    expect(resolved).toEqual({});
  });
});