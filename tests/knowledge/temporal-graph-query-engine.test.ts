import { describe, it, expect } from "vitest";
import { TemporalGraphQueryEngine } from "../src/knowledge/temporal-graph-query-engine";

describe("TemporalGraphQueryEngine", () => {
  it("should correctly query a simple graph with temporal constraints", async () => {
    const engine = new TemporalGraphQueryEngine();
    const nodes = new Map([
      ["n1", { id: "n1", content: "User A", createdAt: 100, expiresAt: 200 }],
      ["n2", { id: "n2", content: "User B", createdAt: 100, expiresAt: 300 }],
    ]);
    const edges = [
      { sourceId: "n1", targetId: "n2", type: "KNOWS", createdAt: 150, expiresAt: 250 },
    ];
    engine.setGraphData({ nodes, edges });

    const currentTime = 200;
    const query = "Find connections between User A and User B at time 200.";
    const result = await engine.query(query, currentTime);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("KNOWS");
  });

  it("should filter out relationships that have expired", async () => {
    const engine = new TemporalGraphQueryEngine();
    const nodes = new Map([
      ["n1", { id: "n1", content: "User A", createdAt: 100, expiresAt: 200 }],
      ["n2", { id: "n2", content: "User B", createdAt: 100, expiresAt: 300 }],
    ]);
    const edges = [
      { sourceId: "n1", targetId: "n2", type: "KNOWS", createdAt: 150, expiresAt: 199 }, // Expired
      { sourceId: "n1", targetId: "n2", type: "FOLLOWS", createdAt: 150, expiresAt: 350 }, // Active
    ];
    engine.setGraphData({ nodes, edges });

    const currentTime = 250;
    const query = "Find all connections between User A and User B at time 250.";
    const result = await engine.query(query, currentTime);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("FOLLOWS");
  });

  it("should handle queries where the current time is before the relationship creation time", async () => {
    const engine = new TemporalGraphQueryEngine();
    const nodes = new Map([
      ["n1", { id: "n1", content: "User A", createdAt: 100, expiresAt: 200 }],
      ["n2", { id: "n2", content: "User B", createdAt: 100, expiresAt: 300 }],
    ]);
    const edges = [
      { sourceId: "n1", targetId: "n2", type: "KNOWS", createdAt: 250, expiresAt: 350 }, // Created after query time
    ];
    engine.setGraphData({ nodes, edges });

    const currentTime = 200;
    const query = "Find connections between User A and User B at time 200.";
    const result = await engine.query(query, currentTime);

    expect(result).toHaveLength(0);
  });
});