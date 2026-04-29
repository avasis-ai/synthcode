import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV148 } from "../src/validation/structured-tool-output-validation-context-enricher-v148";
import { ValidationContext } from "../src/validation/validation-context-v147";

describe("StructuredToolOutputValidationContextEnricherV148", () => {
  it("should enrich a context with basic operational data when provided", () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV148();
    const mockContext: ValidationContext = {
      // Assuming ValidationContext has some basic structure, we mock it minimally
      // For this test, we focus on the enrichment part.
      source: "test-source",
      metadata: { key: "value" },
    } as unknown as ValidationContext;

    const operationalContext: OperationalContext = {
      cpuUtilization: 0.5,
      memoryUsageBytes: 1024 * 1024,
      timestampMs: Date.now(),
      isHighPriority: true,
    };

    const enrichedContext = enricher.enrich(mockContext, operationalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.operationalContext).toEqual(operationalContext);
    expect(enrichedContext).toHaveProperty("operationalContext");
  });

  it("should handle missing optional operational context fields gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV148();
    const mockContext: ValidationContext = {
      source: "test-source",
      metadata: {},
    } as unknown as ValidationContext;

    const partialOperationalContext: OperationalContext = {
      // Only providing a subset of optional fields
      maxExecutionTimeMs: 5000,
      agentOperationalFlags: { network: true },
    };

    const enrichedContext = enricher.enrich(mockContext, partialOperationalContext);

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.operationalContext).toEqual(partialOperationalContext);
    expect(enrichedContext).toHaveProperty("operationalContext");
  });

  it("should return a context structure compatible with the enriched type", () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV148();
    const mockContext: ValidationContext = {
      source: "test-source",
      metadata: {},
    } as unknown as ValidationContext;

    const operationalContext: OperationalContext = {};

    const enrichedContext = enricher.enrich(mockContext, operationalContext);

    // Check if the resulting object structure matches the expected enriched type
    expect(typeof enrichedContext).toBe("object");
    expect(enrichedContext).toHaveProperty("operationalContext");
    // We can't strictly check inheritance without type guards, but we check for the key presence
    expect(Object.keys(enrichedContext)).toEqual([...Object.keys(mockContext), "operationalContext"]);
  });
});