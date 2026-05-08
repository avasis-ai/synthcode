import { describe, it, expect } from "vitest";
import { TimeWindowReducer, PruningStrategy, ResourceMetrics } from "../src/gate/contextual-observation-gate.js";

describe("TimeWindowReducer", () => {
  it("should prune messages older than the specified time window", () => {
    const maxTimeWindowMinutes = 5;
    const reducer = new TimeWindowReducer(maxTimeWindowMinutes);

    const now = Date.now();
    const oldMessage = {
      role: "user",
      content: [{ type: "text", text: "Old message" }],
      timestamp: now - (maxTimeWindowMinutes + 1) * 60 * 1000,
    };
    const recentMessage = {
      role: "assistant",
      content: [{ type: "text", text: "Recent message" }],
      timestamp: now - 1 * 60 * 1000,
    };

    const context: Message[] = [oldMessage, recentMessage];
    const metrics: ResourceMetrics = {
      latencyMs: 100,
      costUnits: 0.1,
      resourceUsageScore: 0.5,
    };

    const prunedContext = reducer.apply(context, metrics);

    expect(prunedContext).toHaveLength(1);
    expect(prunedContext[0]).toBe(recentMessage);
  });

  it("should not prune messages if all are within the time window", () => {
    const maxTimeWindowMinutes = 10;
    const reducer = new TimeWindowReducer(maxTimeWindowMinutes);

    const now = Date.now();
    const message1 = {
      role: "user",
      content: [{ type: "text", text: "Message 1" }],
      timestamp: now - 1 * 60 * 1000,
    };
    const message2 = {
      role: "assistant",
      content: [{ type: "text", text: "Message 2" }],
      timestamp: now - 5 * 60 * 1000,
    };

    const context: Message[] = [message1, message2];
    const metrics: ResourceMetrics = {
      latencyMs: 100,
      costUnits: 0.1,
      resourceUsageScore: 0.5,
    };

    const prunedContext = reducer.apply(context, metrics);

    expect(prunedContext).toHaveLength(2);
    expect(prunedContext).toEqual(context);
  });

  it("should handle an empty context gracefully", () => {
    const maxTimeWindowMinutes = 5;
    const reducer = new TimeWindowReducer(maxTimeWindowMinutes);

    const context: Message[] = [];
    const metrics: ResourceMetrics = {
      latencyMs: 100,
      costUnits: 0.1,
      resourceUsageScore: 0.5,
    };

    const prunedContext = reducer.apply(context, metrics);

    expect(prunedContext).toHaveLength(0);
  });
});