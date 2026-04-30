import { describe, it, expect } from "vitest";
import { ContextEnricherService } from "../src/validation/structured-tool-call-validator-context-enricher-v162";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should enrich context correctly with basic tool call details", () => {
    const enricher = new ContextEnricherService();
    const currentContext = {
      state: { userId: "user123" },
      history: [],
      globalConstraints: { maxRetries: 3 },
    };
    const toolCallDetails = {
      toolName: "getWeather",
      arguments: { location: "New York", unit: "celsius" },
    };

    const result = enricher.enrichContext(currentContext, toolCallDetails);

    expect(result.enrichedContext).toHaveProperty("toolCallDetails");
    expect(result.enrichedContext.toolCallDetails).toEqual({
      toolName: "getWeather",
      arguments: { location: "New York", unit: "celsius" },
    });
    expect(result.validationPayload).toEqual({});
  });

  it("should handle context enrichment when history is present", () => {
    const enricher = new ContextEnricherService();
    const currentContext = {
      state: { userId: "user123" },
      history: [{ role: "user", content: { type: "text", text: "What is the weather?" } }],
      globalConstraints: {},
    };
    const toolCallDetails = {
      toolName: "getWeather",
      arguments: { location: "London" },
    };

    const result = enricher.enrichContext(currentContext, toolCallDetails);

    expect(result.enrichedContext).toHaveProperty("history");
    expect(result.enrichedContext.history).toEqual(currentContext.history);
    expect(result.enrichedContext).toHaveProperty("toolCallDetails");
  });

  it("should correctly populate validation payload when constraints are involved", () => {
    const enricher = new ContextEnricherService();
    const currentContext = {
      state: { limit: 10 },
      history: [],
      globalConstraints: { maxRetries: 5 },
    };
    const toolCallDetails = {
      toolName: "searchItems",
      arguments: { query: "laptop", limit: 20 },
    };

    const result = enricher.enrichContext(currentContext, toolCallDetails);

    expect(result.validationPayload).toHaveProperty("constraintCheck");
    expect(result.validationPayload.constraintCheck).toEqual({
      maxRetries: 5,
    });
  });
});