import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV160 } from "../src/validation/structured-tool-output-validation-context-enricher-v160";
import { ResourceContext, ValidationContext } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricherV160", () => {
  it("should correctly enrich context with resource usage when provided", () => {
    const mockResourceContext: ResourceContext = {
      cpuUsage: 0.5,
      memoryFootprint: 1024,
      executionTimeMs: 500,
      startTime: 1678886400000,
      endTime: 1678886400500,
    };
    const enricher = new StructuredToolOutputValidationContextEnricherV160(mockResourceContext);
    const validationContext: ValidationContext = {
      messages: [],
      metadata: { source: "test" },
    };

    const enrichedContext = enricher.enrich(validationContext);

    expect(enrichedContext.metadata).toHaveProperty("resourceContext");
    expect(enrichedContext.metadata).toEqual({
      resourceContext: mockResourceContext,
    });
  });

  it("should handle missing resource context gracefully", () => {
    const mockResourceContext: ResourceContext = {};
    const enricher = new StructuredToolOutputValidationContextEnricherV160(mockResourceContext);
    const validationContext: ValidationContext = {
      messages: [{ role: "user", content: "test" }],
      metadata: { initial: true },
    };

    const enrichedContext = enricher.enrich(validationContext);

    expect(enrichedContext.metadata).toHaveProperty("resourceContext");
    expect(enrichedContext.metadata).toEqual({
      resourceContext: mockResourceContext,
    });
  });

  it("should preserve existing metadata while adding resource context", () => {
    const mockResourceContext: ResourceContext = { cpuUsage: 0.8 };
    const enricher = new StructuredToolOutputValidationContextEnricherV160(mockResourceContext);
    const initialMetadata: Record<string, unknown> = {
      sessionId: "abc-123",
      userType: "premium",
    };
    const validationContext: ValidationContext = {
      messages: [],
      metadata: initialMetadata,
    };

    const enrichedContext = enricher.enrich(validationContext);

    expect(enrichedContext.metadata).toEqual({
      ...initialMetadata,
      resourceContext: mockResourceContext,
    });
  });
});