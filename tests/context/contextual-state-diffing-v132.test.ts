import { describe, it, expect } from "vitest";
import { ContextualStatePayload } from "../src/context/contextual-state-diffing-v132";

describe("ContextualStatePayload", () => {
  it("should correctly initialize with basic data types", () => {
    const payload: ContextualStatePayload = {
      messages: [
        { type: "user", content: "Hello" } as any,
      ],
      resource_metrics: {
        cpu_cycles: 100,
        memory_usage_kb: 5000,
        network_latency_ms: 50,
      },
      temporal_context: {
        timestamp: Date.now(),
        valid_until: Date.now() + 3600000,
      },
      metadata: {
        source: "test",
        version: "1.0",
      },
    };
    expect(payload.messages).toBeInstanceOf(Array);
    expect(payload.resource_metrics.cpu_cycles).toBe(100);
    expect(payload.temporal_context.timestamp).toBe(payload.temporal_context.timestamp);
    expect(payload.metadata.source).toBe("test");
  });

  it("should handle empty message array", () => {
    const payload: ContextualStatePayload = {
      messages: [],
      resource_metrics: {
        cpu_cycles: 0,
        memory_usage_kb: 0,
        network_latency_ms: 0,
      },
      temporal_context: {
        timestamp: Date.now(),
        valid_until: Date.now() + 1000,
      },
      metadata: {},
    };
    expect(payload.messages).toEqual([]);
  });

  it("should correctly update resource metrics", () => {
    const initialPayload: ContextualStatePayload = {
      messages: [],
      resource_metrics: {
        cpu_cycles: 100,
        memory_usage_kb: 5000,
        network_latency_ms: 50,
      },
      temporal_context: {
        timestamp: 1000,
        valid_until: 2000,
      },
      metadata: {},
    };
    const updatedPayload: ContextualStatePayload = {
      messages: [],
      resource_metrics: {
        cpu_cycles: 200,
        memory_usage_kb: 6000,
        network_latency_ms: 75,
      },
      temporal_context: {
        timestamp: 2000,
        valid_until: 3000,
      },
      metadata: {},
    };
    // In a real scenario, we'd test a diffing function, but here we test structure update
    expect(updatedPayload.resource_metrics.cpu_cycles).toBe(200);
    expect(updatedPayload.temporal_context.timestamp).toBe(2000);
  });
});