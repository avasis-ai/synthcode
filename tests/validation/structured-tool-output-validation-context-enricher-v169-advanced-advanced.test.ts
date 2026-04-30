import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV169AdvancedAdvanced } from "../src/validation/structured-tool-output-validation-context-enricher-v169-advanced-advanced";

describe("StructuredToolOutputValidationContextEnricherV169AdvancedAdvanced", () => {
  it("should enrich context correctly when history source provides data", async () => {
    const mockHistorySource: any = {
      enrich: async (context: Record<string, unknown>) => ({ ...context, historyData: "mock_history" }),
    };
    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedAdvanced(
      mockHistorySource,
      null,
      null
    );
    const initialContext: Record<string, unknown> = { initial: "context" };
    const enrichedContext = await enricher.enrich(initialContext);
    expect(enrichedContext).toHaveProperty("historyData", "mock_history");
    expect(enrichedContext).toHaveProperty("initial", "context");
  });

  it("should enrich context correctly when state source provides data", async () => {
    const mockStateSource: any = {
      enrich: async (context: Record<string, unknown>) => ({ ...context, stateData: "mock_state" }),
    };
    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedAdvanced(
      null,
      mockStateSource,
      null
    );
    const initialContext: Record<string, unknown> = { initial: "context" };
    const enrichedContext = await enricher.enrich(initialContext);
    expect(enrichedContext).toHaveProperty("stateData", "mock_state");
    expect(enrichedContext).toHaveProperty("initial", "context");
  });

  it("should enrich context correctly when node source provides data", async () => {
    const mockNodeSource: any = {
      enrich: async (context: Record<string, unknown>) => ({ ...context, nodeData: "mock_node" }),
    };
    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedAdvanced(
      null,
      null,
      mockNodeSource
    );
    const initialContext: Record<string, unknown> = { initial: "context" };
    const enrichedContext = await enricher.enrich(initialContext);
    expect(enrichedContext).toHaveProperty("nodeData", "mock_node");
    expect(enrichedContext).toHaveProperty("initial", "context");
  });
});