import { describe, it, expect } from "vitest";
import { ContextSource, EnrichmentPipeline, Structur } from "../src/validation/structured-tool-call-validator-context-enricher-v151-advanced-advanced";

describe("Structur", () => {
  it("should correctly enrich context when all sources are available", async () => {
    const mockContext: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> } = {
      history: [{ role: "user", content: { type: "text", value: "Hello" } }],
      systemPrompt: "You are a helpful assistant.",
      knowledge: { user_id: "123" },
    };

    const mockSource1: ContextSource = {
      sourceName: "Source1",
      enrich: async (context) => {
        expect(context.history).toHaveLength(1);
        return [{ role: "tool", content: { type: "text", value: "Enriched by Source1" } }];
      },
    };

    const mockSource2: ContextSource = {
      sourceName: "Source2",
      enrich: async (context) => {
        return [{ role: "tool", content: { type: "text", value: "Enriched by Source2" } }];
      },
    };

    const mockPipeline: EnrichmentPipeline = {
      enrich: async (context) => ({
        enrichedContext: [{ role: "tool", content: { type: "text", value: "Pipeline enriched" } }],
        finalContext: { ...context.knowledge, pipeline_data: true },
      }),
    };

    const structur = new Structur(mockSource1, mockSource2, mockPipeline);
    const result = await structur.enrichContext(mockContext);

    expect(result.enrichedContext).toHaveLength(3);
    expect(result.finalContext).toEqual({ user_id: "123", pipeline_data: true });
  });

  it("should handle missing context sources gracefully", async () => {
    const mockContext: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> } = {
      history: [],
      systemPrompt: "Test",
      knowledge: {},
    };

    const mockSource1: ContextSource = {
      sourceName: "Source1",
      enrich: async (context) => {
        return [{ role: "tool", content: { type: "text", value: "Source1 OK" } }];
      },
    };

    // Only provide one source, simulating missing others
    const structur = new Structur(mockSource1, undefined, undefined);
    const result = await structur.enrichContext(mockContext);

    expect(result.enrichedContext).toHaveLength(1);
    expect(result.finalContext).toEqual({});
  });

  it("should correctly merge knowledge from multiple sources and pipeline", async () => {
    const mockContext: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> } = {
      history: [],
      systemPrompt: "System",
      knowledge: { initial: true },
    };

    const mockSource1: ContextSource = {
      sourceName: "Source1",
      enrich: async (context) => {
        return [{ role: "tool", content: { type: "text", value: "S1" } }];
      },
    };

    const mockSource2: ContextSource = {
      sourceName: "Source2",
      enrich: async (context) => {
        return [{ role: "tool", content: { type: "text", value: "S2" } }];
      },
    };

    const mockPipeline: EnrichmentPipeline = {
      enrich: async (context) => ({
        enrichedContext: [{ role: "tool", content: { type: "text", value: "Pipeline" } }],
        finalContext: { ...context.knowledge, pipeline_flag: true },
      }),
    };

    const structur = new Structur(mockSource1, mockSource2, mockPipeline);
    const result = await structur.enrichContext(mockContext);

    // Check if knowledge from all parts is merged
    expect(result.finalContext).toEqual({ initial: true, pipeline_flag: true });
  });
});