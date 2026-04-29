import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV143 } from "../src/validation/structured-tool-output-validation-context-enricher-v143";
import { Message } from "../src/validation/types";

describe("StructuredToolOutputValidationContextEnricherV143", () => {
  it("should initialize with no enrichers if none are provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV143([]);
    // We can't easily test the private field, but we can test the functionality assuming it's set up.
    // For this test, we'll just ensure instantiation doesn't crash.
    expect(enricher).toBeDefined();
  });

  it("should correctly enrich context when provided with mock enrichers", async () => {
    const mockEnricher1 = {
      enrichContext: async (messages: Message[], executionContext: Record<string, unknown>, sessionState: Record<string, unknown>) => ({
        contextKey1: "enriched1",
      }),
    };
    const mockEnricher2 = {
      enrichContext: async (messages: Message[], executionContext: Record<string, unknown>, sessionState: Record<string, unknown>) => ({
        contextKey2: "enriched2",
      }),
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV143([mockEnricher1, mockEnricher2]);
    const messages: Message[] = [{ role: "user", content: "test" }];
    const executionContext: Record<string, unknown> = { userId: "user123" };
    const sessionState: Record<string, unknown> = { sessionId: "sess456" };

    const result = await enricher.enrichContext(messages, executionContext, sessionState);

    expect(result).toEqual({
      contextKey1: "enriched1",
      contextKey2: "enriched2",
    });
  });

  it("should return an empty context if no enrichers are provided", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV143([]);
    const messages: Message[] = [{ role: "user", content: "test" }];
    const executionContext: Record<string, unknown> = {};
    const sessionState: Record<string, unknown> = {};

    const result = await enricher.enrichContext(messages, executionContext, sessionState);

    expect(result).toEqual({});
  });
});