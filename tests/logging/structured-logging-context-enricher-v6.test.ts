import { describe, it, expect } from "vitest";
import { ContextEnricherV6, EnrichedContext } from "../src/logging/structured-logging-context-enricher-v6";

describe("ContextEnricherV6", () => {
  it("should correctly enrich context with mock data", () => {
    const mockContext: EnrichedContext = {
      resource_usage: {
        cpu_usage_percent: 50.5,
        memory_usage_bytes: 1024 * 1024 * 50,
        network_latency_ms: 25,
      },
      temporal_context: {
        start_time_utc: new Date("2023-01-01T00:00:00.000Z"),
        end_time_utc: new Date("2023-01-01T00:05:00.000Z"),
        duration_ms: 5000,
      },
      dependency_graph_metadata: {
        service_a: { version: "1.0" },
        service_b: { version: "2.1" },
      },
    };

    const enricher = new ContextEnricherV6();
    const result = enricher.enrich(mockContext);

    expect(result).toEqual(mockContext);
    expect(result.resource_usage.cpu_usage_percent).toBe(50.5);
    expect(result.temporal_context.duration_ms).toBe(5000);
  });

  it("should handle null end_time_utc in temporal context", () => {
    const mockContext: EnrichedContext = {
      resource_usage: {
        cpu_usage_percent: 10.0,
        memory_usage_bytes: 1024,
        network_latency_ms: 5,
      },
      temporal_context: {
        start_time_utc: new Date(),
        end_time_utc: null,
        duration_ms: 0,
      },
      dependency_graph_metadata: {},
    };

    const enricher = new ContextEnricherV6();
    const result = enricher.enrich(mockContext);

    expect(result).toEqual(mockContext);
    expect(result.temporal_context.end_time_utc).toBeNull();
  });

  it("should return the same structure when inputs are minimal", () => {
    const mockContext: EnrichedContext = {
      resource_usage: {
        cpu_usage_percent: 0,
        memory_usage_bytes: 0,
        network_latency_ms: 0,
      },
      temporal_context: {
        start_time_utc: new Date(0),
        end_time_utc: null,
        duration_ms: 0,
      },
      dependency_graph_metadata: {},
    };

    const enricher = new ContextEnricherV6();
    const result = enricher.enrich(mockContext);

    expect(result).toEqual(mockContext);
  });
});