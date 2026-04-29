import { describe, it, expect } from "vitest";
import {
  ContextEnricher,
  ResourceMetrics,
  TemporalConstraints,
  DependencyContext,
  ContextEnrichmentPayload,
} from "../src/validation/structured-tool-output-validation-context-enricher-v151";

describe("ContextEnricher", () => {
  it("should correctly enrich context with resource metrics", () => {
    const metrics: ResourceMetrics = {
      cpu_usage_percent: 45.5,
      memory_usage_bytes: 1024 * 1024 * 50,
      network_latency_ms: 120,
    };
    const enrichedContext = ContextEnricher.enrichWithResourceMetrics(metrics);

    expect(enrichedContext).toHaveProperty("resource_metrics");
    expect(enrichedContext.resource_metrics).toEqual(metrics);
  });

  it("should correctly enrich context with temporal constraints", () => {
    const constraints: TemporalConstraints = {
      execution_duration_ms: 5000,
      timestamp_utc: Date.now(),
      deadline_ms: Date.now() + 3600000,
    };
    const enrichedContext = ContextEnricher.enrichWithTemporalConstraints(constraints);

    expect(enrichedContext).toHaveProperty("temporal_constraints");
    expect(enrichedContext.temporal_constraints).toEqual(constraints);
  });

  it("should correctly enrich context with dependency information", () => {
    const dependencies: DependencyContext = {
      dependencies: {
        "auth_service": "v2.1.0",
        "user_profile": "v1.5.3",
      },
      graph_depth: 3,
    };
    const enrichedContext = ContextEnricher.enrichWithDependencyContext(dependencies);

    expect(enrichedContext).toHaveProperty("dependency_context");
    expect(enrichedContext.dependency_context).toEqual(dependencies);
  });
});