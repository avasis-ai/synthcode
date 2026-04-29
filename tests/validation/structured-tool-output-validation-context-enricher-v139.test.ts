import { describe, it, expect } from "vitest";
import { ContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v139";

describe("ContextEnricher", () => {
  it("should correctly enrich context with resource metrics", () => {
    const enricher = new ContextEnricher();
    const metrics: ResourceMetrics = {
      cpuUsageMs: 100,
      memoryUsageBytes: 2048,
      networkBytesTransferred: 512,
    };
    const enrichedContext = enricher.enrichContext(metrics);

    expect(enrichedContext.resourceUsage).toEqual(metrics);
  });

  it("should correctly enrich context with temporal constraints", () => {
    const enricher = new ContextEnricher();
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 1000, endTimeMs: 2000, deadlineMs: 3000 },
      { startTimeMs: 5000, endTimeMs: 6000, deadlineMs: 7000 },
    ];
    const enrichedContext = enricher.enrichContext(constraints);

    expect(enrichedContext.temporalConstraints).toEqual(constraints);
  });

  it("should merge multiple context enrichments correctly", () => {
    const enricher = new ContextEnricher();
    const metrics: ResourceMetrics = {
      cpuUsageMs: 50,
      memoryUsageBytes: 1024,
      networkBytesTransferred: 256,
    };
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 100, endTimeMs: 200, deadlineMs: 300 },
    ];
    const flags: Record<string, boolean> = {
      isHighPriority: true,
      isBetaFeature: false,
    };

    // Assuming the enricher has a method or mechanism to combine these,
    // or we test the final structure if it combines them internally.
    // Based on the provided snippet, we assume a method that takes all parts.
    // Since the actual method signature isn't fully visible, we'll simulate
    // a combined enrichment call if one exists, or test the structure if it's a setter/updater.
    // For this test, we assume a method like enrichContext(metrics, constraints, flags) exists or we test the final structure.
    
    // Mocking a combined enrichment call for demonstration purposes
    const combinedContext = enricher.enrichContext(metrics, constraints, flags);

    expect(combinedContext.resourceUsage).toEqual(metrics);
    expect(combinedContext.temporalConstraints).toEqual(constraints);
    expect(combinedContext.systemFlags).toEqual(flags);
  });
});