import { describe, it, expect } from "vitest";
import { AdvancedValidationContext } from "../src/validation/structured-tool-call-validator-context-enricher-v155-advanced-advanced";

describe("AdvancedValidationContext Enrichment", () => {
  it("should correctly enrich context with resource usage metrics when provided", () => {
    const baseContext = {
      messages: [{ role: "user", content: "Test message" }],
      sessionId: "session123",
    };
    const resourceMetadata = { estimatedCost: 10.5, timeWindowMs: 3600000 };
    const temporalMetadata = { startTime: 1672531200000, endTime: 1672534800000 };
    const enrichedContext = {
      resourceUsageMetrics: {
        storage: { bytes: 1024, count: 5 },
        network: { bytes: 5120, count: 2 },
      },
      // Assume other fields might be present or derived
    };

    const context = AdvancedValidationContext.enrich(
      baseContext,
      resourceMetadata,
      temporalMetadata,
      enrichedContext
    );

    expect(context.baseContext).toEqual(baseContext);
    expect(context.resourceMetadata).toEqual(resourceMetadata);
    expect(context.temporalMetadata).toEqual(temporalMetadata);
    expect(context.enrichedContext).toEqual(enrichedContext);
  });

  it("should handle zero or minimal values in metadata without error", () => {
    const baseContext = {
      messages: [],
      sessionId: "empty-session",
    };
    const resourceMetadata = { estimatedCost: 0, timeWindowMs: 0 };
    const temporalMetadata = { startTime: 0, endTime: 0 };
    const enrichedContext = {
      resourceUsageMetrics: {
        storage: { bytes: 0, count: 0 },
        network: { bytes: 0, count: 0 },
      },
    };

    const context = AdvancedValidationContext.enrich(
      baseContext,
      resourceMetadata,
      temporalMetadata,
      enrichedContext
    );

    expect(context.resourceMetadata.estimatedCost).toBe(0);
    expect(context.temporalMetadata.startTime).toBe(0);
    expect(context.enrichedContext.resourceUsageMetrics.storage.bytes).toBe(0);
  });

  it("should correctly merge and validate context structure", () => {
    const baseContext = {
      messages: [{ role: "user", content: "Hi" }],
      sessionId: "valid-session",
    };
    const resourceMetadata = { estimatedCost: 5.0, timeWindowMs: 7200000 };
    const temporalMetadata = { startTime: 1672531200000, endTime: 1672534800000 };
    const enrichedContext = {
      resourceUsageMetrics: {
        storage: { bytes: 2048, count: 10 },
        network: { bytes: 1024, count: 5 },
      },
    };

    const context = AdvancedValidationContext.enrich(
      baseContext,
      resourceMetadata,
      temporalMetadata,
      enrichedContext
    );

    expect(context).toBeDefined();
    expect(typeof context.baseContext.messages).toBe('object');
    expect(typeof context.resourceMetadata.estimatedCost).toBe('number');
    expect(context.enrichedContext.resourceUsageMetrics.storage.bytes).toBe(2048);
  });
});