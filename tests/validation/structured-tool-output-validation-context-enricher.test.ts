import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich the context with source context metadata", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const initialContext: ValidationContext = {
      id: "test-id",
      metadata: {
        source: "initial",
        timestamp: "2023-01-01T00:00:00Z",
      },
    };
    const sourceContext: Record<string, unknown> = {
      tool_output: {
        result: "success",
        details: "some data",
      },
      user_input: "test query",
    };
    const payload: ContextEnrichmentPayload = {
      context: initialContext,
      sourceContext: sourceContext,
    };

    const enrichedContext = enricher.enrich(payload);

    expect(enrichedContext.id).toBe(initialContext.id);
    expect(enrichedContext.metadata).toEqual({
      source: "initial",
      timestamp: "2023-01-01T00:00:00Z",
      tool_output: {
        result: "success",
        details: "some data",
      },
      user_input: "test query",
    });
  });

  it("should handle empty source context gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const initialContext: ValidationContext = {
      id: "test-id-empty",
      metadata: {
        source: "initial",
      },
    };
    const sourceContext: Record<string, unknown> = {};
    const payload: ContextEnrichmentPayload = {
      context: initialContext,
      sourceContext: sourceContext,
    };

    const enrichedContext = enricher.enrich(payload);

    expect(enrichedContext.id).toBe(initialContext.id);
    expect(enrichedContext.metadata).toEqual({
      source: "initial",
    });
  });

  it("should merge existing metadata with source context metadata", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const initialContext: ValidationContext = {
      id: "test-id-merge",
      metadata: {
        source: "initial",
        version: "1.0",
      },
    };
    const sourceContext: Record<string, unknown> = {
      tool_output: {
        result: "success",
      },
    };
    const payload: ContextEnrichmentPayload = {
      context: initialContext,
      sourceContext: sourceContext,
    };

    const enrichedContext = enricher.enrich(payload);

    expect(enrichedContext.id).toBe(initialContext.id);
    expect(enrichedContext.metadata).toEqual({
      source: "initial",
      version: "1.0",
      tool_output: {
        result: "success",
      },
    });
  });
});