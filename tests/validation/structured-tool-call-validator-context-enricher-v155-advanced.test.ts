import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherAdvanced } from "../src/validation/structured-tool-call-validator-context-enricher-v155-advanced";
import { Context } from "../src/validation/structured-tool-call-validator-context-enricher-v155-advanced.types";

describe("StructuredToolCallValidatorContextEnricherAdvanced", () => {
  it("should process a list of enrichments sequentially and return the final context", async () => {
    const mockEnrichment1: any = {
      name: "enricher1",
      enricher: async (context: Context) => {
        const newContext: Context = {
          messages: [...context.messages, { role: "user", content: "updated by 1" }],
          initialContext: { ...context.initialContext, key1: "value1" },
        };
        return { enrichedContext: newContext, success: true };
      },
    };
    const mockEnrichment2: any = {
      name: "enricher2",
      enricher: async (context: Context) => {
        const newContext: Context = {
          messages: [...context.messages, { role: "assistant", content: "updated by 2" }],
          initialContext: { ...context.initialContext, key2: "value2" },
        };
        return { enrichedContext: newContext, success: true };
      },
    };

    const enricher = new StructuredToolCallValidatorContextEnricherAdvanced([mockEnrichment1, mockEnrichment2]);
    const initialContext: Context = {
      messages: [{ role: "user", content: "initial message" }],
      initialContext: { initialKey: "initialValue" },
    };

    const result = await enricher.enrichContext(initialContext);

    expect(result.success).toBe(true);
    expect(result.enrichedContext.messages).toHaveLength(3);
    expect(result.enrichedContext.initialContext).toEqual({
      initialKey: "initialValue",
      key1: "value1",
      key2: "value2",
    });
  });

  it("should stop and return failure if any enrichment step fails", async () => {
    const mockEnrichment1: any = {
      name: "enricher1",
      enricher: async (context: Context) => {
        const newContext: Context = {
          messages: [...context.messages, { role: "user", content: "updated by 1" }],
          initialContext: { ...context.initialContext, key1: "value1" },
        };
        return { enrichedContext: newContext, success: true };
      },
    };
    const mockEnrichment2: any = {
      name: "enricher2",
      enricher: async (context: Context) => {
        return { enrichedContext: context, success: false, reason: "Simulated failure" };
      },
    };
    const mockEnrichment3: any = {
      name: "enricher3",
      enricher: async (context: Context) => {
        // This should not be reached
        return { enrichedContext: context, success: true };
      },
    };

    const enricher = new StructuredToolCallValidatorContextEnricherAdvanced([mockEnrichment1, mockEnrichment2, mockEnrichment3]);
    const initialContext: Context = {
      messages: [{ role: "user", content: "initial message" }],
      initialContext: { initialKey: "initialValue" },
    };

    const result = await enricher.enrichContext(initialContext);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("Simulated failure");
    // Check that the context reflects the state *before* the failing step (i.e., after enricher1)
    expect(result.enrichedContext.messages).toHaveLength(2);
    expect(result.enrichedContext.initialContext).toEqual({
      initialKey: "initialValue",
      key1: "value1",
    });
  });

  it("should handle an empty list of enrichments gracefully", async () => {
    const enricher = new StructuredToolCallValidatorContextEnricherAdvanced([]);
    const initialContext: Context = {
      messages: [{ role: "user", content: "initial message" }],
      initialContext: { initialKey: "initialValue" },
    };

    const result = await enricher.enrichContext(initialContext);

    expect(result.success).toBe(true);
    expect(result.enrichedContext).toEqual(initialContext);
    expect(result.reason).toBeUndefined();
  });
});