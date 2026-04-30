import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v162-advanced-advanced";
import { ValidationContext } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich context with basic metadata when provided", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      messages: [],
      metadata: { initial_key: "initial_value" },
    };
    const mockAdvancedMetadata = {
      timestamp: Date.now(),
      resource_id: "res-123",
      lineage: [{ source: "system", step: 1, parent_context_id: "parent-a" }],
    };

    const enrichedContext = enricher.enrich(mockContext, mockAdvancedMetadata);

    expect(enrichedContext.metadata).toHaveProperty("resource_id", "res-123");
    expect(enrichedContext.metadata).toHaveProperty("timestamp", mockAdvancedMetadata.timestamp);
    expect(enrichedContext.metadata).toHaveProperty("lineage", mockAdvancedMetadata.lineage);
  });

  it("should correctly merge existing metadata with advanced metadata", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      messages: [],
      metadata: { initial_key: "initial_value", existing_meta: true },
    };
    const mockAdvancedMetadata = {
      timestamp: Date.now(),
      resource_id: "res-456",
      lineage: [{ source: "system", step: 2, parent_context_id: "parent-b" }],
    };

    const enrichedContext = enricher.enrich(mockContext, mockAdvancedMetadata);

    expect(enrichedContext.metadata).toHaveProperty("initial_key", "initial_value");
    expect(enrichedContext.metadata).toHaveProperty("existing_meta", true);
    expect(enrichedContext.metadata).toHaveProperty("resource_id", "res-456");
    expect(enrichedContext.metadata).toHaveProperty("timestamp", mockAdvancedMetadata.timestamp);
  });

  it("should handle empty metadata and advanced metadata gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: ValidationContext = {
      messages: [],
      metadata: {},
    };
    const mockAdvancedMetadata = {
      timestamp: Date.now(),
      resource_id: "",
      lineage: [],
    };

    const enrichedContext = enricher.enrich(mockContext, mockAdvancedMetadata);

    expect(enrichedContext.metadata).toEqual({
      resource_id: "",
      timestamp: mockAdvancedMetadata.timestamp,
      lineage: [],
    });
  });
});