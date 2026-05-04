import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricherV163AdvancedAdvanced } from "../src/validation/structured-tool-call-context-enricher-v163-advanced-advanced";

describe("StructuredToolCallContextEnricherV163AdvancedAdvanced", () => {
  it("should correctly enrich context with summary, constraints, and knowledge snippets", async () => {
    const mockHistory: Message[] = [
      { type: "user", content: "What is the capital of France?" }
    ];
    const mockStore: { getSummary: (history: Message[]) => string } = {
      getSummary: (history) => "The user is asking about geography.",
    };
    const mockResolver: { getActiveConstraints: () => Record<string, string> } = {
      getActiveConstraints: () => ({ "location": "Europe", "topic": "Geography" }),
    };
    const mockRetriever: { retrieveSnippets: (query: string) => string[] } = {
      retrieveSnippets: (query) => ["Paris is the capital of France.", "France is in Europe."],
    };

    const enricher = new StructuredToolCallContextEnricherV163AdvancedAdvanced(
      mockStore,
      mockResolver,
      mockRetriever
    );

    const context = await enricher.enrichContext(mockHistory, "capital of France");

    expect(context.historySummary).toBe("The user is asking about geography.");
    expect(context.activeConstraints).toEqual({ "location": "Europe", "topic": "Geography" });
    expect(context.knowledgeSnippets).toEqual(["Paris is the capital of France.", "France is in Europe."]);
  });

  it("should handle empty history and no active constraints gracefully", async () => {
    const mockHistory: Message[] = [];
    const mockStore: { getSummary: (history: Message[]) => string } = {
      getSummary: (history) => "",
    };
    const mockResolver: { getActiveConstraints: () => Record<string, string> } = {
      getActiveConstraints: () => ({}),
    };
    const mockRetriever: { retrieveSnippets: (query: string) => string[] } = {
      retrieveSnippets: (query) => [],
    };

    const enricher = new StructuredToolCallContextEnricherV163AdvancedAdvanced(
      mockStore,
      mockResolver,
      mockRetriever
    );

    const context = await enricher.enrichContext(mockHistory, "general query");

    expect(context.historySummary).toBe("");
    expect(context.activeConstraints).toEqual({});
    expect(context.knowledgeSnippets).toEqual([]);
  });

  it("should use the query to retrieve relevant knowledge snippets", async () => {
    const mockHistory: Message[] = [
      { type: "user", content: "Tell me about quantum computing." }
    ];
    const mockStore: { getSummary: (history: Message[]) => string } = {
      getSummary: (history) => "The user is interested in advanced computing topics.",
    };
    const mockResolver: { getActiveConstraints: () => Record<string, string> } = {
      getActiveConstraints: () => ({ "domain": "Science" }),
    };
    const mockRetriever: { retrieveSnippets: (query: string) => string[] } = {
      retrieveSnippets: (query) => [`Quantum computing uses qubits.`, `Qubits are fundamental to quantum computation.`]
    };

    const enricher = new StructuredToolCallContextEnricherV163AdvancedAdvanced(
      mockStore,
      mockResolver,
      mockRetriever
    );

    const context = await enricher.enrichContext(mockHistory, "quantum computing");

    expect(context.knowledgeSnippets).toEqual(["Quantum computing uses qubits.", "Qubits are fundamental to quantum computation."]);
  });
});