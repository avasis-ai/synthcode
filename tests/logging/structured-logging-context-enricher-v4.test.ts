import { describe, it, expect } from "vitest";
import {
  StructuredLoggingContextEnricherV4,
  ExecutionContext,
  ResourceMetrics,
  DependencyGraphSnapshot,
} from "../src/logging/structured-logging-context-enricher-v4";

describe("StructuredLoggingContextEnricherV4", () => {
  it("should correctly enrich context with resource metrics", () => {
    const mockContext: ExecutionContext = {
      resourceMetrics: {
        cpuUsageMs: 100,
        memoryUsageBytes: 2048,
        networkLatencyMs: 50,
      },
      graphSnapshot: {
        nodes: ["A", "B"],
        edges: [{ source: "A", target: "B", weight: 0.5 }],
      },
    };

    const enrichedContext = StructuredLoggingContextEnricherV4.enrich(mockContext);

    expect(enrichedContext).toHaveProperty("resourceMetrics");
    expect(enrichedContext.resourceMetrics).toEqual({
      cpuUsageMs: 100,
      memoryUsageBytes: 2048,
      networkLatencyMs: 50,
    });
  });

  it("should correctly enrich context with dependency graph snapshot", () => {
    const mockContext: ExecutionContext = {
      resourceMetrics: {
        cpuUsageMs: 0,
        memoryUsageBytes: 0,
        networkLatencyMs: 0,
      },
      graphSnapshot: {
        nodes: ["Start", "End"],
        edges: [{ source: "Start", target: "End", weight: 1.0 }],
      },
    };

    const enrichedContext = StructuredLoggingContextEnricherV4.enrich(mockContext);

    expect(enrichedContext).toHaveProperty("graphSnapshot");
    expect(enrichedContext.graphSnapshot).toEqual({
      nodes: ["Start", "End"],
      edges: [{ source: "Start", target: "End", weight: 1.0 }],
    });
  });

  it("should return a context object containing all provided information", () => {
    const mockContext: ExecutionContext = {
      resourceMetrics: {
        cpuUsageMs: 500,
        memoryUsageBytes: 4096,
        networkLatencyMs: 150,
      },
      graphSnapshot: {
        nodes: ["X", "Y", "Z"],
        edges: [{ source: "X", target: "Y", weight: 0.8 }, { source: "Y", target: "Z", weight: 0.2 }],
      },
    };

    const enrichedContext = StructuredLoggingContextEnricherV4.enrich(mockContext);

    expect(enrichedContext).toEqual({
      resourceMetrics: {
        cpuUsageMs: 500,
        memoryUsageBytes: 4096,
        networkLatencyMs: 150,
      },
      graphSnapshot: {
        nodes: ["X", "Y", "Z"],
        edges: [{ source: "X", target: "Y", weight: 0.8 }, { source: "Y", target: "Z", weight: 0.2 }],
      },
    });
  });
});