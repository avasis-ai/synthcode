import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher } from "../src/validation/structured-tool-call-context-enricher-v168-advanced-advanced";
import { Message } from "../src/validation/types";

describe("StructuredToolCallContextEnricher", () => {
  it("should correctly enrich context when prerequisites are clearly defined", () => {
    const enricher = new StructuredToolCallContextEnricher();
    const context: Message[] = [
      { role: "user", content: [{ type: "text", text: "What are the steps to deploy a microservice?" }] },
      { role: "assistant", content: [{ type: "tool_use", tool_call: { name: "deploy_service", input: { service_name: "auth" } } }] },
    ];
    enricher.setContext(context);
    const enrichedContext = enricher.enrichContext();

    expect(enrichedContext.prerequisites).toBeDefined();
    expect(enrichedContext.prerequisites!.suggested_steps).toHaveLength(1);
    expect(enrichedContext.potential_side_effects).toHaveLength(0);
    expect(enrichedContext.context_confidence_score).toBeGreaterThanOrEqual(0);
  });

  it("should handle context with multiple potential side effects", () => {
    const enricher = new StructuredToolCallContextEnricher();
    const context: Message[] = [
      { role: "user", content: [{ type: "text", text: "Update the database schema." }] },
      { role: "assistant", content: [{ type: "tool_use", tool_call: { name: "update_schema", input: { table: "users" } } }] },
    ];
    enricher.setContext(context);
    const enrichedContext = enricher.enrichContext();

    expect(enrichedContext.potential_side_effects).toBeDefined();
    expect(enrichedContext.potential_side_effects!).toHaveLength(1);
    expect(enrichedContext.potential_side_effects![0].effect).toContain("database");
  });

  it("should return a default structure when context is minimal or empty", () => {
    const enricher = new StructuredToolCallContextEnricher();
    const context: Message[] = [];
    enricher.setContext(context);
    const enrichedContext = enricher.enrichContext();

    expect(enrichedContext.prerequisites).toBeDefined();
    expect(enrichedContext.prerequisites!.suggested_steps).toHaveLength(0);
    expect(enrichedContext.potential_side_effects).toHaveLength(0);
    expect(enrichedContext.context_confidence_score).toBe(0);
  });
});