import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v167-advanced";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should correctly enrich context with basic message structure", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const context: any = {
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
      knowledgeGraph: {},
      toolSchemas: {},
    };
    const enrichedContext = enricher.enrichContext(context);
    expect(enrichedContext.messages).toHaveLength(2);
    expect(enrichedContext.knowledgeGraph).toEqual({});
    expect(enrichedContext.toolSchemas).toEqual({});
  });

  it("should handle context with existing knowledge graph and tool schemas", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const context: any = {
      messages: [],
      knowledgeGraph: { "entity1": "data" },
      toolSchemas: { "toolA": { type: "object" } },
    };
    const enrichedContext = enricher.enrichContext(context);
    expect(enrichedContext.knowledgeGraph).toEqual({ "entity1": "data" });
    expect(enrichedContext.toolSchemas).toEqual({ "toolA": { type: "object" } });
  });

  it("should return the context unchanged if no enrichment logic is triggered", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const initialContext: any = {
      messages: [{ role: "user", content: "Test" }],
      knowledgeGraph: {},
      toolSchemas: {},
    };
    const enrichedContext = enricher.enrichContext(initialContext);
    expect(enrichedContext).toEqual(initialContext);
  });
});