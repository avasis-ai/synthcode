import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v167";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should enrich the context with basic tool output when no messages are present", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const rawToolOutput = { result: "success", data: [1, 2, 3] };
    const enrichedContext = enricher.enrich(rawToolOutput, [], undefined);

    expect(enrichedContext.toolOutput).toEqual(rawToolOutput);
    expect(enrichedContext.messages).toEqual([]);
    expect(enrichedContext.metadata).toBeUndefined();
  });

  it("should enrich the context with existing messages and tool output", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const rawToolOutput = { result: "processed", count: 5 };
    const messages = [
      { type: "user", content: "Test message" }
    ];
    const metadata = { source: "test-run" };
    const enrichedContext = enricher.enrich(rawToolOutput, messages, metadata);

    expect(enrichedContext.toolOutput).toEqual(rawToolOutput);
    expect(enrichedContext.messages).toEqual(messages);
    expect(enrichedContext.metadata).toEqual(metadata);
  });

  it("should handle null or undefined tool output gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const rawToolOutput = null;
    const messages = [{ type: "user", content: "Test" }];
    const enrichedContext = enricher.enrich(rawToolOutput, messages, undefined);

    expect(enrichedContext.toolOutput).toBeNull();
    expect(enrichedContext.messages).toEqual(messages);
    expect(enrichedContext.metadata).toBeUndefined();
  });
});