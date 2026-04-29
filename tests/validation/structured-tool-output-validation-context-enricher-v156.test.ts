import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v156";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich context with basic metrics when history is provided", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext = {
      history: [
        new UserMessage("Hello"),
        new AssistantMessage("Hi there!")
      ],
      metrics: {
        totalTokens: 100,
        cumulativeResourceUsage: {
          cpu: 0.5,
          memory: 0.2
        },
        toolCallSummary: {
          successCount: 1,
          failureCount: 0
        }
      },
      enrichedContext: {}
    };

    const result = enricher.enrich(mockContext);

    expect(result.enrichedContext).toHaveProperty("history");
    expect(result.enrichedContext).toHaveProperty("metrics");
    expect(result.enrichedContext.history).toEqual(mockContext.history);
    expect(result.enrichedContext.metrics).toEqual(mockContext.metrics);
  });

  it("should handle empty history and metrics gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext = {
      history: [],
      metrics: {
        totalTokens: 0,
        cumulativeResourceUsage: {},
        toolCallSummary: {
          successCount: 0,
          failureCount: 0
        }
      },
      enrichedContext: {}
    };

    const result = enricher.enrich(mockContext);

    expect(result.enrichedContext).toHaveProperty("history");
    expect(result.enrichedContext.history).toEqual([]);
    expect(result.enrichedContext.metrics).toEqual(mockContext.metrics);
  });

  it("should correctly merge existing enriched context", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const initialEnrichedContext = {
      sessionId: "abc-123",
      userPreferences: {
        theme: "dark"
      }
    };
    const mockContext = {
      history: [new UserMessage("Test")],
      metrics: {
        totalTokens: 50,
        cumulativeResourceUsage: {
          cpu: 0.1,
          memory: 0.1
        },
        toolCallSummary: {
          successCount: 1,
          failureCount: 0
        }
      },
      enrichedContext: initialEnrichedContext
    };

    const result = enricher.enrich(mockContext);

    expect(result.enrichedContext).toEqual({
      ...initialEnrichedContext,
      history: mockContext.history,
      metrics: mockContext.metrics
    });
  });
});