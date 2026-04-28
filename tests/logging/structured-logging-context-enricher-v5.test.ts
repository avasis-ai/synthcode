import { describe, it, expect } from "vitest";
import { ContextEnricherV5 } from "../src/logging/structured-logging-context-enricher-v5";

describe("ContextEnricherV5", () => {
  it("should enrich context with basic resource usage when provided", () => {
    const mockResourceUsage = {
      cpu_percent: 15.5,
      memory_bytes: 1024 * 1024 * 512,
      network_io_bytes: 512 * 1024,
    };
    const enricher = new ContextEnricherV5();
    const enrichedContext = enricher.enrichContext(null, mockResourceUsage);

    expect(enrichedContext).toHaveProperty("resource_usage");
    expect(enrichedContext.resource_usage).toEqual(mockResourceUsage);
  });

  it("should correctly merge temporal constraints into the context", () => {
    const mockTemporalConstraint = {
      start_time_utc: new Date("2023-01-01T00:00:00.000Z"),
      end_time_utc: new Date("2023-01-01T01:00:00.000Z"),
      duration_ms: 3600000,
    };
    const enricher = new ContextEnricherV5();
    const enrichedContext = enricher.enrichContext(null, null, mockTemporalConstraint);

    expect(enrichedContext).toHaveProperty("temporal_constraint");
    expect(enrichedContext.temporal_constraint).toEqual(mockTemporalConstraint);
  });

  it("should combine multiple metadata types correctly", () => {
    const mockDependencyGraphMetadata = {
      dependencies: { "A": "B", "B": "C" },
      graph_version: "1.2.0",
    };
    const mockResourceUsage = {
      cpu_percent: 20.0,
      memory_bytes: 2048 * 1024 * 1024,
      network_io_bytes: 1024 * 1024,
    };
    const mockTemporalConstraint = {
      start_time_utc: new Date(),
      end_time_utc: new Date(),
      duration_ms: 1000,
    };

    const enricher = new ContextEnricherV5();
    const enrichedContext = enricher.enrichContext(
      null,
      mockResourceUsage,
      mockTemporalConstraint,
      mockDependencyGraphMetadata
    );

    expect(enrichedContext).toHaveProperty("resource_usage", mockResourceUsage);
    expect(enrichedContext).toHaveProperty("temporal_constraint", mockTemporalConstraint);
    expect(enrichedContext).toHaveProperty("dependency_graph_metadata", mockDependencyGraphMetadata);
  });
});