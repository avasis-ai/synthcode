import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v169-advanced";
import { ExecutionHistory } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricher", () => {
  const enricher = new StructuredToolOutputValidationContextEnricher();

  it("should enrich context with basic metadata when history is provided", () => {
    const mockHistory: ExecutionHistory = {
      messages: [{ role: "user", content: "Hello" }],
      state: { user_id: "123" },
    };

    const enrichedContext = enricher.enrich(mockHistory);

    expect(enrichedContext.originalHistory).toBe(mockHistory);
    expect(enrichedContext.metadata).toEqual({}); // Assuming initial metadata is empty
  });

  it("should correctly copy the original history when enriching", () => {
    const mockHistory: ExecutionHistory = {
      messages: [{ role: "assistant", content: "Tool output" }],
      state: { tool_call_count: 1 },
    };

    const enrichedContext = enricher.enrich(mockHistory);

    expect(enrichedContext.originalHistory.messages).toHaveLength(1);
    expect(enrichedContext.originalHistory.state).toEqual({ tool_call_count: 1 });
  });

  it("should handle an empty history gracefully", () => {
    const mockHistory: ExecutionHistory = {
      messages: [],
      state: {},
    };

    const enrichedContext = enricher.enrich(mockHistory);

    expect(enrichedContext.originalHistory).toEqual(mockHistory);
    expect(Object.keys(enrichedContext.metadata)).toHaveLength(0);
  });
});