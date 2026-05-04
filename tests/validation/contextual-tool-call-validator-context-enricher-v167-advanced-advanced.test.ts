import { describe, it, expect } from "vitest";
import { ContextualToolCallValidatorContextEnricher } from "../src/validation/contextual-tool-call-validator-context-enricher-v167-advanced-advanced";

describe("ContextualToolCallValidatorContextEnricher", () => {
  it("should enrich context when context service provides necessary information", async () => {
    const mockContextService: any = {
      gatherContext: jest.fn().mockResolvedValue({
        enrichedContext: { userPreferences: "premium", lastQuery: "weather" },
        summary: "User is interested in travel.",
      }),
    };
    const enricher = new ContextualToolCallValidatorContextEnricher(mockContextService);

    const history = [{ role: "user", content: [{ type: "text", text: "What's the weather?" }] }];
    const currentState = {};
    const constraints = {};

    const result = await enricher.enrichContext(history, currentState, constraints);

    expect(mockContextService.gatherContext).toHaveBeenCalledWith(
      history,
      currentState,
      constraints
    );
    expect(result).toEqual({
      enrichedContext: { userPreferences: "premium", lastQuery: "weather" },
      summary: "User is interested in travel.",
    });
  });

  it("should handle empty history and state gracefully", async () => {
    const mockContextService: any = {
      gatherContext: jest.fn().mockResolvedValue({
        enrichedContext: {},
        summary: "No specific context found.",
      }),
    };
    const enricher = new ContextualToolCallValidatorContextEnricher(mockContextService);

    const history: any[] = [];
    const currentState: any = {};
    const constraints: any = {};

    const result = await enricher.enrichContext(history, currentState, constraints);

    expect(mockContextService.gatherContext).toHaveBeenCalledWith(
      history,
      currentState,
      constraints
    );
    expect(result).toEqual({
      enrichedContext: {},
      summary: "No specific context found.",
    });
  });

  it("should pass constraints correctly to the context gathering service", async () => {
    const mockContextService: any = {
      gatherContext: jest.fn().mockResolvedValue({
        enrichedContext: { constraintUsed: true },
        summary: "Context enriched with constraints.",
      }),
    };
    const enricher = new ContextualToolCallValidatorContextEnricher(mockContextService);

    const history = [{ role: "user", content: [{ type: "text", text: "Test" }] }];
    const currentState = { session: "active" };
    const constraints = { requiredScope: "finance" };

    await enricher.enrichContext(history, currentState, constraints);

    expect(mockContextService.gatherContext).toHaveBeenCalledWith(
      history,
      currentState,
      constraints
    );
  });
});