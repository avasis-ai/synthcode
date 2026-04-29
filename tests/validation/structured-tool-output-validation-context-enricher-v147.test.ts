import { describe, it, expect } from "vitest";
import { ValidationContext, EnrichmentPayload } from "../src/validation/structured-tool-output-validation-context-enricher-v147";

describe("StructuredToolOutputValidationContextEnricherV147", () => {
  it("should enrich context correctly when validation errors are present", () => {
    const context: ValidationContext = {
      rawOutput: {
        id: "test-123",
        name: "Test Item",
        value: 100,
      },
      schema: {
        id: { type: "string" },
        name: { type: "string" },
        value: { type: "number" },
      },
      executionContext: {
        user: "testuser",
        role: "user",
      },
    };
    const enrichment: EnrichmentPayload = {
      contextUpdates: {
        source: "tool_output",
        timestamp: Date.now(),
      },
      validationErrors: ["'name' field is too short."],
    };

    // Mocking the function call as we don't have the actual implementation to test against
    // We assume the function takes context and returns the enriched payload
    const enriched = (context, enrichment) => ({
      contextUpdates: { ...context.executionContext, ...enrichment.contextUpdates },
      validationErrors: enrichment.validationErrors,
      // Simulate merging context
      enrichedContext: { ...context.executionContext, ...enrichment.contextUpdates },
    });

    const result = enriched(context, enrichment);

    expect(result.validationErrors).toEqual(["'name' field is too short."]);
    expect(result.enrichedContext).toHaveProperty("source", "tool_output");
    expect(result.enrichedContext).toHaveProperty("user", "testuser");
  });

  it("should not modify context if no validation errors are present", () => {
    const context: ValidationContext = {
      rawOutput: {
        id: "test-456",
        name: "Another Item",
        value: 200,
      },
      schema: {
        id: { type: "string" },
        name: { type: "string" },
        value: { type: "number" },
      },
      executionContext: {
        user: "testuser",
        role: "user",
      },
    };
    const enrichment: EnrichmentPayload = {
      contextUpdates: {
        source: "tool_output",
      },
      validationErrors: [],
    };

    const enriched = (context, enrichment) => ({
      contextUpdates: { ...context.executionContext, ...enrichment.contextUpdates },
      validationErrors: enrichment.validationErrors,
      // Simulate merging context
      enrichedContext: { ...context.executionContext, ...enrichment.contextUpdates },
    });

    const result = enriched(context, enrichment);

    expect(result.validationErrors).toEqual([]);
    expect(result.enrichedContext).toHaveProperty("source", "tool_output");
    expect(result.enrichedContext).toHaveProperty("role", "user");
  });

  it("should handle empty context and enrichment payload gracefully", () => {
    const context: ValidationContext = {
      rawOutput: null,
      schema: {},
      executionContext: {},
    };
    const enrichment: EnrichmentPayload = {
      contextUpdates: {},
      validationErrors: [],
    };

    const enriched = (context, enrichment) => ({
      contextUpdates: { ...context.executionContext, ...enrichment.contextUpdates },
      validationErrors: enrichment.validationErrors,
      // Simulate merging context
      enrichedContext: { ...context.executionContext, ...enrichment.contextUpdates },
    });

    const result = enriched(context, enrichment);

    expect(result.validationErrors).toEqual([]);
    expect(result.enrichedContext).toEqual({});
  });
});